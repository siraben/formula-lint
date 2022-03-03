import Parser from 'tree-sitter';
import Formula from 'tree-sitter-formula';
import { readFileSync } from 'fs';
const {Query, QueryCursor} = Parser;

const parser = new Parser();
parser.setLanguage(Formula);

// Load the file "test.4ml"
const sourceCode = readFileSync('test.4ml', 'utf8');
const tree = parser.parse(sourceCode);

// Query the domain nodes using the tree-sitter query
const domainQuery = new Query(Formula, '(domain (domain_sig_config (domain_sig name: _ @n))) @d');

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

function capturesByName(tree, query, name) {
  return formatCaptures(tree,query.captures(tree.rootNode).filter(x => x.name == name)).map(function (x) { delete x.name; return x; });
}

console.log('Domain declarations:');
console.log(capturesByName(tree, domainQuery, 'n'));

// Query all the type_decl nodes
const typeDeclQuery = new Query(Formula, '(type_decl ((bareid) @n)) @d');

console.log('Type declarations:');
console.log(capturesByName(tree, typeDeclQuery, 'n'));
