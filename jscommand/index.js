const e = Math.E,
	pi = Math.PI,
	sqrt = x => Math.sqrt(x),
	cbrt = x => Math.cbrt(x),
	exp = x => Math.exp(x),
	log = x => Math.log(x),
	log2 = x => Math.log2(x),
	log10 = x => Math.log10(x),
	abs = x => Math.abs(x),
	sign = x => Math.sign(x),
	round = x => Math.round(x),
	floor = x => Math.floor(x),
	trunc = x => Math.trunc(x),
	ceil = x => Math.ceil(x),
	pow = (x,y) => Math.pow(x,y),
	mod = (x,y) => x%y;

const prefix = "/js ";

let formatNumbers = true,
	liveEval = true;
function formatNumber(x) {
	if (!formatNumbers) return x;

	const sign = Math.sign(x),
		  t = Math.abs(x);

	let o;
	if (t < 1E3) {
		o = t;
	} else if (t >= 1E3 && t < 1E6) {
		o = (t / 1E3).toFixed(2) + "K";
	} else if (t >= 1E6 && t < 1E9) {
		o = (t / 1E6).toFixed(2) + "M";
	} else if (t >= 1E9 && t < 1E12) {
		o = (t / 1E9).toFixed(2) + "B";
	}
	else o = t;

	return `${sign===-1?"-":""}${o}`
}

let prevMsg = "",
	prevLiveMsg = "";

function format(value) {
	try {
		let output;
		if (typeof value === "undefined") {
			output = "§8§oundefined";
		}
		else if (typeof value === "function") {
			output = value.toString();
			output = output.trim(); // for some reason, Function.toString() has a new line char at the start and at the end.
		}
		else if (typeof value === "number") {
			output = `§f${formatNumber(value)}`;
		}
		else if (typeof value !== "string") {
			output = "§e§l" + JSON.stringify(value, undefined, 2);
			// if has new lines, then recolor each line separately
			if (output.includes("\n")) {
				output = output.replace(/\n/g,`\n`);
				const lastNewLine = output.lastIndexOf("\n");
				output = output.slice(0,lastNewLine) + "\n§e§l" + output.slice(lastNewLine+1);
			}
		}
		else output = value;

		return output
	}
	catch (e) {
		return "§c§oCouldn't format!";
	}
}

function formatGlobalVar(variable) {
	return `§6§l${variable} §r§8= §r§o${format(this[variable])}§r§7;`;
}

register('tick', () => {
	if (liveEval === true && Client.isInChat()) {
		const msg = Client.getCurrentChatMessage();

		// don't recalculate if it didn't change
		if (msg === prevMsg)
			return;

		prevMsg = msg;

		if (msg.slice(0,prefix.length) === prefix) {

			const input = msg.slice(prefix.length),
				  output = evalJS(input);

			if (output) {
				const message = new Message(formatOutputForChat(input,output));
				message.setChatLineId(94358);
				ChatLib.chat(message);
				prevLiveMsg = message;
			}
		}
	}
});

function evalJS(toEval) {
	if (toEval === "") return;

	let evaluated;
	try {
		const vars = Object.keys(this); // get all local variable names

		// this is the global container of all the declared variables
		if (toEval === "this") {
			const varsToOmit = ["require","exports","module","prevMsg","prefix","format","formatNumber","evalJS","formatOutputForChat","prevLiveMsg","prevOutputs","printAndSaveMessage","formatGlobalVar"]; // List of all the variable names that should be hidden
			evaluated = ["§d§lLocal variables\n"];

			for (let i=0; i<vars.length; i++) {
				const variable = vars[i];
				if (!varsToOmit.includes(variable)) {
					evaluated.push(formatGlobalVar(variable));
				}
			}

			evaluated = evaluated.join("\n")
		}
		else if (vars.includes(toEval)) {
			evaluated = formatGlobalVar(toEval);
		}
		else 
			/* binding this helps with function declarations: now 
			   function name () {
				  ...
			   }
			   actually stores the function into this[name]
			 
			*/
			evaluated = eval.call(this,toEval);
	}
	catch (e) {
		evaluated = `§c§o${e.toString()}`;
	}

	return format(evaluated);
}

function formatOutputForChat(input, output) {
	const bar = `§0§l§o${ChatLib.getChatBreak("─")}`;
	return `${bar}\n§b§lInput\n\n${input}\n${bar}\n§9§lOutput\n\n${output}\n${bar}\n`;
}

function printAndSaveMessage(text) {
	const message = new Message(text);
	ChatLib.chat(message);
	prevOutputs.push(message);
}

let prevOutputs = [];
register('command', (...strings) => {
	let input = strings.join(" ");
	if (!input || input === "") {
		printAndSaveMessage("§cNo input provided.");
	}
	else if (input === "help") {
		const bar = `§b§l§o${ChatLib.getChatBreak("─")}`;
		printAndSaveMessage(`${bar}\n§a/js <javascript> §7- §owhile typing out the code its real-time evaluation will be shown in the chat; can also be used as a command.\n§a/js clear §7- §oclears the chat from all the outputs of the /js command.\n§a/js this §7- §olists all the global variables.\n§a/js formatNumbers <true|false> §7- §owhen true, all numbers that are shown in chat will be written in shorthand.\n§a/js liveEval <true|false> §7- §owhen true, auto-evaluate javascript in real-time while typing the /js command.\n${bar}`);
	}
	else if (input === "clear") {
		for (let i=0; i<prevOutputs.length; i++) {
			prevOutputs[i].edit(new Message(""));
			ChatLib.deleteChat(prevOutputs[i]);
		}

		prevOutputs = [];

		ChatLib.deleteChat(94358);

		printAndSaveMessage("§8The chat was succesfully cleared.");
	}
	else {
		const output = evalJS(input);

		if (output) {
			// clear live output from chat
			ChatLib.deleteChat(94358);

			printAndSaveMessage(formatOutputForChat(input,output))
		}
	}
}).setName(prefix.slice(1,-1));