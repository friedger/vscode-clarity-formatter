import * as vscode from "vscode";

function getFullDocRange(document: vscode.TextDocument): vscode.Range {
  return document.validateRange(
    new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(Number.MAX_VALUE, Number.MAX_VALUE)
    )
  );
}

function insertNewline(state: any, token: string) {
  if (!state.newLine) {
    state.formattedDocument += "\n";
  }
  return state;
}

function indent(state: any) {
  state.formattedDocument += " ".repeat(2).repeat(state.openLists);
  return state;
}

function formatOpenList(state: any, token: string) {
  const charIsEscaped = state.escaped;
  if (charIsEscaped) {
    state.escaped = false;
  }

  const charIsInString = state.string;
  if (charIsInString) {
    state.formattedDocument += token;
  } else {
    const isOnNewLine = state.newLine;
    if (!isOnNewLine) {
      insertNewline(state, token);
    }
    state.formattedDocument = state.formattedDocument.replace(/ +$/g, "");
    state = indent(state);
    state.formattedDocument += token;
    state.openLists++;
    state.array = true;
    state.arrayOpen = true;
    state.newLine = false;
  }

  return state;
}

function formatCloseList(state: any, token: string) {
  state.arrayOpen = false; // usually arrayOpen is set to false earlier
  const charIsEscaped = state.escaped;
  if (charIsEscaped) {
    state.escaped = false;
  }

  const charIsInString = state.string;
  if (!charIsInString) {
    state.formattedDocument = state.formattedDocument.replace(/(\n| )+$/g, "");
    state.formattedDocument += token;
    state.openLists--;
    state.array = state.openLists === 0;
    state.newLine = false;
  }

  return state;
}

function formatNewLine(state: any, token: string) {
  // don't add another newline within an array
  if (state.newLine && state.array) {
    return state;
  }
  state.newLine = true;
  state.comment = false;
  if (!state.arrayOpen) {
    state.formattedDocument = state.formattedDocument.replace(/ +$/g, "");
    state.formattedDocument += token;
  }
  return state;
}

function formatWhitespace(state: any, token: string) {
  const charIsInsideACommentStringOrArray =
    state.comment ||
    state.string ||
    (state.array && !state.arrayOpen && !state.newLine);
  if (charIsInsideACommentStringOrArray) {
    state.formattedDocument += token;
  }

  return state;
}

function formatComment(state: any, token: string) {
  state.arrayOpen = false;
  const charIsEscaped = state.escaped;
  if (charIsEscaped) {
    state.escaped = false;
  } else if (!state.comment) {
    if (state.commentStart) {
      state.comment = true;
    } else {
      state.commentStart = true;
    }
  }
  state.formattedDocument += token;

  return state;
}

function formatEscape(state: any, token: string) {
  state.arrayOpen = true;
  state.escaped = !state.escaped;
  state.formattedDocument += token;

  return state;
}

function formatQuote(state: any, token: string) {
  state.arrayOpen = false;
  const charIsEscaped = state.escaped;
  if (charIsEscaped) {
    state.escaped = false;
  } else {
    state.string = !state.string;
  }

  state.formattedDocument += token;

  return state;
}

export function formatDocument(document: string) {
  let state = {
    document: document,
    formattedDocument: "",
    openLists: 0,
    commentStart: false,
    comment: false,
    escaped: false,
    string: false,
    newLine: false,
    arrayOpen: false,
    array: false,
  };

  console.log({ state });
  let formatters: any = {
    "(": formatOpenList,
    ")": formatCloseList,
    "\r": formatNewLine,
    "\n": formatNewLine,
    " ": formatWhitespace,
    "\t": formatWhitespace,
    ";": formatComment,
    "\\": formatEscape,
    '"': formatQuote,
  };

  for (var i = 0; i < state.document.length; i++) {
    const cursor = state.document.charAt(i);
    const formatter = formatters[cursor];

    if (formatter) {
      state = formatter(state, cursor);
    } else {
      if (state.newLine && state.array) {
        state = indent(state);
      }
      state.formattedDocument += cursor;
      state.arrayOpen = false;
      state.newLine = false;
      if (state.escaped) {
        state.escaped = false;
      }
    }
  }
  return state.formattedDocument;
}

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("clarity", {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      const formattedDocument = formatDocument(document.getText());
      return [
        vscode.TextEdit.replace(getFullDocRange(document), formattedDocument),
      ];
    },
  });
}
