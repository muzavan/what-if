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

class IfExpression {
    // Essentially, a binary tree.
    constructor(clause, ifYes, ifNo){
        this.id = generateID()
        this.clause = clause
        this.ifYes = ifYes
        this.ifNo = ifNo
    }

    asMermaidNode() {
        // TODO: obvious bug, should handle double quotes or bracket
        // too lazy to check/validate it.
        if (this.ifYes == null && this.ifNo == null) {
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
        
        const yesFlows = this.connectFlows(clauseNode, this.ifYes, "YES");
        content = content.concat(yesFlows);

        const noFlows = this.connectFlows(clauseNode, this.ifNo, "NO");
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
    const ifClause = document.getElementById("ifClause").value;
    const root = parseAsBinaryTree(ifClause);
    
    const flowChart = new FlowChart(root);

    console.log(flowChart);

    const newValue = flowChart.mermaidGraph();
    
    console.log(newValue);

    const ifGraph = document.getElementById("ifGraph");
    ifGraph.removeAttribute("data-processed"); // to force mermaid to reload
    ifGraph.className = "mermaid";
    ifGraph.innerHTML = newValue;

    mermaid.contentLoaded();
}

function parseAsBinaryTree(formula) {
    // This is only for MVP purpose.
    // Might want to revisit the parsing
    // Based on the IF specification.

    formula = formula.trim();
    // formula is in the format of IF(...)
    if (formula.length > 0 && formula[0] == "=") {
        return parseAsBinaryTree(formula.substring(1));
    }

    if (formula.length < 3 && formula.substring(0, 3).toLowerCase() != "if(" || formula[formula.length - 1] != ")")  {
        // Not an IF expression
        // Assume it's a valid endpoint.
        return new IfExpression(formula, null, null);
    }

    const coreExpression = formula.substring(3, formula.length-1);
    let res = parseExpression(coreExpression, ";");
    if (res != null) {
        return res;
    }
    res = parseExpression(coreExpression, ",");
    if (res != null) {
        return res;
    } 
    throw new Error(`expression is without valid delimiter: ${formula}`);;
}

function isStringDelimiter(ch) {
    return ["'", '"'].find( x => x == ch);
}

function parseExpression(expression, delimiter){
    console.log({expression, delimiter});

    // Split it to CLAUSE<delimiter>YES<delimiter>NO(which basically the rest of it)
    const StateUnknown = -999;
    const StateExprClause = 0;
    const StateExprYes = 1;
    const StateDone = 2;
    const StateString = -1;

    let prevState = StateUnknown;
    let state = StateExprClause;
    let currPos = 0;
    let startExprPos = 0;
    let stringDelimiter = "";
    let exprClause = "";
    let exprYes = "";
    let exprNo = "";

    // need to track whether the delimiter belongs to child formula or not T_T
    let brackets = [];

    while (currPos < expression.length) {
        const currCh = expression[currPos];
        if (state == StateString) {
            if (currCh == stringDelimiter) {
                state = prevState;
            }
            // if not, just another part of the string, move on
            currPos++;
            continue;
        }

        if (isStringDelimiter(currCh)){
            prevState = state;
            state = StateString;
            stringDelimiter = currCh;
            currPos++;
            continue;
        }

        if (currCh == "(") {
            brackets.push(currPos);
            currPos++;
            continue;
        }

        if (currCh == ")") {
            const popped = brackets.pop();
            if (popped === undefined) {
                throw new Error(`invalid brackets expression: ${expression.substring(startExprPos,currPos)}`);
            }
        }

        // delimiter and not part of child formula.
        if (currCh == delimiter && brackets.length == 0) {
            if (state == StateExprClause) {
                exprClause = expression.substring(startExprPos, currPos);
                state = StateExprYes;
                currPos++;
                startExprPos = currPos;
                continue;
            }

            if (state == StateExprYes) {
                exprYes = expression.substring(startExprPos, currPos);
                exprNo = expression.substring(currPos+1);
                state = StateDone;
                break;
            }
        }

        // just part of the expression, move on
        currPos++;
        continue;

    }

    if (state != StateDone) {
        console.log("parsing failed, no valid delimiter", expression);
        return null;
    }

    console.log({exprClause, exprYes, exprNo});
    return new IfExpression(exprClause, parseAsBinaryTree(exprYes), parseAsBinaryTree(exprNo));
}

