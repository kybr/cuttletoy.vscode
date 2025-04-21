import * as vscode from 'vscode';
import * as dgram from 'node:dgram';

let socket: dgram.Socket;

export function activate(context: vscode.ExtensionContext) {
	console.log('cuttletoy extension active');
	const show = vscode.window.showInformationMessage;

	socket = dgram.createSocket('udp4');

	socket.on('error', (err) => {
		show(`cuttletoy: socket error: ${err}`);
	});

	socket.on('listening', () => {
		socket.setBroadcast(true);
		socket.setSendBufferSize(65536);
		const address = socket.address();
		show(`cuttletoy: listening ${address.address}:${address.port}`);
	});

	socket.on('message', (buffer, info) => {
		show(`socket message: ${buffer} from ${info.address}:${info.port}`);
	});

	socket.bind(7771);

	const disposable = vscode.commands.registerCommand('cuttletoy.fragment', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			show('cuttletoy: no active editor');
			return;
		}

		const text = editor.document.getText();
		if (!text) {
			show('cuttletoy: no text in active editor');
			return;
		}

		const message =
			Buffer.concat([
				Buffer.from('/f\0\0,s\0\0'),
				Buffer.from(text),
				Buffer.alloc(4 - (text.length % 4)),
			]);

		socket.send(message, 7770, '224.0.7.23');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	socket.close();
	console.log('cuttletoy extension deactivated');
	vscode.window.showInformationMessage('cuttletoy: extension deactivated');
}
