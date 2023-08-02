import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true });

function generateID(){
   const length = 6;
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const charLength = chars.length;
   let result = '';
   for ( var i = 0; i < length; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * charLength));
   }
   return result;
}

const ifClauseBtn = document.getElementById("ifClauseBtn");

class BinaryTree {
    constructor(clause, left, right){
        this.id = generateID()
        this.clause = clause
        this.left = left
        this.right = right
    }

    asMermaidNode() {
        // TODO: obvious bug, should handle double quotes or bracket
        // too lazy to check/validate it.
        if (this.left == null && this.right == null) {
            // Should be a Node
            return `${this.id}[${this.clause}]`;
        }
        // Still have a YES/NO relation
        // Should be a Decision
        return `${this.id}{${this.clause}}`;
    }

    connectFlows(current, other, comment) {
        let flows = [];
        if (other == null) {
            return flows;
        }

        const otherNode = other.asMermaidNode();
        flows.push(`${current} -->|${comment}| ${otherNode}`);
        
        const otherFlows = other.asMermaidFlow();
        flows = flows.concat(otherFlows);
        return flows;
    }

    asMermaidFlow() {
        let content = [];
        const clauseNode = this.asMermaidNode();
        
        const yesFlows = this.connectFlows(clauseNode, this.left, "YES");
        content = content.concat(yesFlows);

        const noFlows = this.connectFlows(clauseNode, this.right, "NO");
        content = content.concat(noFlows);

        return content;
    }
}

class FlowChart {
    constructor(root){
        this.root = root;
    }

    mermaidGraph(){
        let content = [];
        content.push("flowchart TD");
        const elements = this.root.asMermaidFlow();
        content = content.concat(elements)
        return content.join(";\n");
    }
}

ifClauseBtn.onclick = function(e) {
    // const ifClauseInput = document.getElementById("ifClause").value;
    const root = new BinaryTree("A1='A'",
        new BinaryTree("A2='B'", new BinaryTree("AB_", null, null), new BinaryTree("AC_", null, null)),
        new BinaryTree("A3='B'", new BinaryTree("X_B", null, null), new BinaryTree("X_C", null, null)),
    )

    const sample = new FlowChart(root);

    
    const newValue = sample.mermaidGraph();
    console.log(newValue);

    const ifGraph = document.getElementById("ifGraph");
    ifGraph.className = "mermaid";
    ifGraph.innerHTML = newValue;

    mermaid.contentLoaded();
}