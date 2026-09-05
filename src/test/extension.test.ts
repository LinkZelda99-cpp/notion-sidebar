import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { normalizeChildPageBlock } from '../notionClient';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('normalizes child pages from their title and block ID', () => {
		const block = normalizeChildPageBlock({
			id: 'child-page-id',
			child_page: { title: 'Nested page' },
		});

		assert.strictEqual(block.type, 'child_page');
		assert.strictEqual(block.text, 'Nested page');
		assert.strictEqual(block.pageId, 'child-page-id');
	});
});
