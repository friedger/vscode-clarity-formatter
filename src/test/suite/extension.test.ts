import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as extension from "../../extension";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Format test", async () => {
    assert.strictEqual(
      extension.formatDocument(";; a comment \n   ( +    \n  2 \n     3)"),
      ";; a comment\n(+\n  2\n  3)"
    );
  });
});
