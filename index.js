import Parser from "tree-sitter";
import Imp from "tree-sitter-formula";
import { readFileSync } from "fs";

const { Query } = Parser;

const args = process.argv.slice(2);

if (args.length != 1) {
  console.error("Usage: npm run lint <file to lint>");
  process.exit(1);
}

const sourceCode = readFileSync(args[0], "utf8");

const parser = new Parser();
parser.setLanguage(Imp);

// Load the file passed as an argument
const tree = parser.parse(sourceCode);

// Query for redundant assignments
const sumCalls = new Query(
  Imp,
  "((func_term name: _ @name (func_term_list (func_or_compr (func_term _ @arg)))) (#match? @name \"sum\")) @func"
);

// Given a raw list of captures, extract the row, column and text.
function formatCaptures(tree, captures) {
  return captures.map((c) => {
    const node = c.node;
    delete c.node;
    c.text = tree.getText(node);
    c.row = node.startPosition.row;
    c.column = node.startPosition.column;
    return c;
  });
}

// Get the captures corresponding to a capture name
function capturesByName(tree, query, name) {
  return formatCaptures(
    tree,
    query.captures(tree.rootNode).filter((x) => x.name == name)
  ).map((x) => {
    delete x.name;
    return x;
  });
}

// Lint the tree with a given message, query and match name
function lint(tree, msg, query, name) {
  console.log(msg);
  console.log(capturesByName(tree, query, name));
}

// lint(tree, "Calls to sum:", sumCalls, "arg");
console.log("Bad cals to sum")
console.log(sumCalls.captures(tree.rootNode).filter((x) => x.name == "arg")
    .map((x) => x.node)
    .filter((x) => x.type != "atom"
        || (x.type == "atom"
            && x.children[0].type != "constant")
        || (x.type == "atom"
            && x.children[0].type == "constant"
            && x.children[0].children[0].type != "real")
    )
    .map((x) => x.parent.parent.parent.parent)
    .map(function (x) {
        return {
            start: x.startPosition,
            end: x.endPosition,
            text: tree.getText(x),
        };
    })
);
