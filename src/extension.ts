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
		socket.addMembership('224.0.7.24');
		socket.setSendBufferSize(65536);
		const address = socket.address();
		show(`cuttletoy: listening ${address.address}:${address.port}`);
	});

	socket.on('message', (buffer, info) => {
		show(`socket message: ${buffer} from ${info.address}:${info.port}`);
	});

	socket.bind(7771);

	const fragment = vscode.commands.registerCommand('cuttletoy.fragment', () => {
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

	context.subscriptions.push(fragment);

	const sync = vscode.commands.registerCommand('cuttletoy.sync', () => {
		const message =
			Buffer.concat([
				Buffer.from('/time\0\0\0,d\0\0'),
				Buffer.alloc(8)
			]);

		socket.send(message, 7770, '224.0.7.23');
	});
	context.subscriptions.push(sync);

	context.subscriptions.push(vscode.commands.registerCommand('cuttletoy.quit', () => {
		socket.send(
			Buffer.from('/quit\0\0\0,\0\0\0'),
			7770,
			'224.0.7.23');
	}));

}

export function deactivate() {
	socket.close();
	console.log('cuttletoy extension deactivated');
	vscode.window.showInformationMessage('cuttletoy: extension deactivated');
}
