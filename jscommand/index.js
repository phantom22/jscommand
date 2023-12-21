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

const PREFIX = "/js ";

function formatTypeToString(value) {
	try {
		let output;
		if (typeof value === "undefined") {
			output = "§8§oundefined";
		}
		else if (typeof value === "function") {
			output = value.toString();
			output = output.trim(); // for some reason, <arrow function>.toString() has a new line char at the start and at the end.
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
		else if (value.slice(0,8) === "https://") {
			output = value;
		}
		else output = `§e"§r§o${value}§r§e"§r`;

		return output
	}
	catch (e) {
		return "§c§oCouldn't format!";
	}
}

let prettyprint = false;
function formatNumber(x) {
	if (!prettyprint) return x;

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

function formatGlobalVar(variable) {
	return `§6§l${variable} §r§8= §r§o${formatTypeToString(this[variable])}§r§7;`;
}

function formatOutputForChat(input, output) {
	const bar = `§0§l§o${ChatLib.getChatBreak("─")}`;
	return `${bar}\n§b§lInput\n\n${input}\n${bar}\n§9§lOutput\n\n${output}\n${bar}\n`;
}

function evalJS(toEval) {
	if (!toEval || toEval === "") return "§cNo input provided.";
	toEval = toEval.trim();

	let evaluated;
	try {
		const vars = Object.keys(this); // get all local variable names

		// this is the global container of all the declared variables
		if (toEval === "t" || toEval === "th" || toEval === "thi") {
			return "§6§lthis§r §8- §7§olists all the global variables.";
		}
		if (toEval === "this") {
			const varsToOmit = ["require","exports","module","prevInput","PREFIX","formatTypeToString","formatNumber","evalJS","formatOutputForChat","prevLiveMsg","commandMessage","liveMessage","formatGlobalVar"]; // List of all the variable names that should be hidden when calling the command /js this
			evaluated = ["§d§lLocal variables\n"];

			for (let i=0; i<vars.length; i++) {
				const variable = vars[i];
				if (!varsToOmit.includes(variable)) {
					evaluated.push(formatGlobalVar(variable));
				}
			}

			return evaluated.join("\n")
		}
		else if (toEval === "h" || toEval === "he" || toEval === "hel") {
			return "§6§lhelp§r §8- §7§odisplays useful info.";
		}
		else if (toEval === "help") {
			const bar = `§b§l§o${ChatLib.getChatBreak("─")}`;
			return `${bar}\n§a/js <javascript> §7- §owhile typing out the code its real-time evaluation will be shown in the chat; can also be used as a command.\n§a/js clear §7- §oclears the chat from all the outputs of the /js command.\n§a/js this §7- §olists all the global variables.\n§a/js prettyprint <true|false> §7- §owhen true, all numbers that are shown in chat will be written in shorthand.\n§a/js livejs <true|false> §7- §owhen true, auto-evaluate javascript in real-time while typing the /js command.\n§a/js wiki <query>§r §7- §osends the link to the specified query.\n§a/js help §7- §odisplays this message.\n${bar}`;
		}
		else if (toEval.slice(0,11) === "prettyprint" && (toEval.slice(12).trim() === "true" || toEval.slice(12).trim() === "false")) {
			prettyprint = Boolean(toEval.slice(12).trim() === "true");
			return formatGlobalVar("prettyprint");
		}
		else if (toEval === "p" || toEval === "pr" || toEval === "pre" || toEval === "pret" || toEval === "prett" || toEval === "pretty" || toEval === "prettyp" || toEval === "prettypr" || toEval === "prettypri" || toEval === "prettyprin" || toEval.slice(0,11) === "prettyprint" && toEval.length > 11) {
			return "§6§lprettyprint§r §e§o<true|false>§r §8- §7§owhen true, all numbers that are shown in chat will be written in shorthand.";
		}
		else if (toEval.slice(0,6) === "livejs" && (toEval.slice(7).trim() === "true" || toEval.slice(7).trim() === "false")) {
			livejs = Boolean(toEval.slice(7).trim() === "true");
			return formatGlobalVar("livejs");
		}
		else if (toEval === "l" || toEval === "li" || toEval === "liv" || toEval === "live" || toEval === "livej" || toEval.slice(0,6) === "livejs" && toEval.length > 6) {
			return "§6§llivejs§r §e§o<true|false>§r §8- §7§owhen true, auto-evaluate javascript in real-time while typing the /js command.";
		}
		else if (toEval === "c" || toEval === "cl" || toEval === "cle" || toEval === "clea" || toEval === "clear") {
			return "§6§lclear§r §8- §7§oclears the chat from all the outputs of the /js command.";
		}
		else if (toEval === "w" || toEval === "wi" || toEval === "wik" || toEval === "wiki" || toEval ==="wiki ") {
			return "§6§lwiki§r §e§o<query>§r §8- §7§osends the link to the specified query.";
		}
		else if (toEval.slice(0,4) === "wiki") { 
			evaluated = `https://wiki.hypixel.net/index.php?search=${toEval.slice(5).trim().replaceAll(" ","+")}&title=Special%3ASearch`
		}
		else if (vars.includes(toEval)) {
			return formatGlobalVar(toEval);
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

	return formatTypeToString(evaluated);
}

function liveMessage(text) {
	const msg = new Message(text);
	msg.setChatLineId(94358);
	ChatLib.chat(msg);
	prevLiveMsg = text;
}

let livejs = true,
	prevInput = "",
	prevLiveMsg = "";
register('tick', () => {
	if (livejs === true && Client.isInChat()) {
		const msg = Client.getCurrentChatMessage();

		// evaluate only once in a row each user input.
		if (msg === prevInput)
			return;

		prevInput = msg;

		if (msg.slice(0,PREFIX.length) === PREFIX) { // does the command start with "/js "?

			const input = msg.slice(PREFIX.length).trim(),
				  output = evalJS(input);

			if (output) {
				const text = formatOutputForChat(input,output);
				liveMessage(text);
			}
		}
	}
});

function commandMessage(text) { 
	const msg = new Message(text);
	msg.setChatLineId(94360);
	ChatLib.chat(msg);
}

register('command', (...strings) => {
	const input = strings.join(" ").trim();
	/* 
		Prevent the code from being executed two times in a row, especially for functions like
			myArray.push(...)
	*/
	if (input === "clear") {
		ChatLib.deleteChat(94358); // live messages
		ChatLib.deleteChat(94360); // command messages
		commandMessage("§8The chat was succesfully cleared.");
	}
	else if (livejs === true && prevLiveMsg !== "") {
		ChatLib.deleteChat(94358);
		commandMessage(prevLiveMsg);
		prevLiveMsg = "";
	}
	else {
		const output = evalJS(input);

		if (output) {
			const text = formatOutputForChat(input,output);
			commandMessage(text)
		}
	}
}).setName(PREFIX.slice(1,-1)); // "js"

/* 
	TODO add listener for chat that matches only certain
	templates and can then extrapolate data from these templates.

	for example: each time that the message "You received X of something" can be matched and X is a number that can be accumulated into a variable.
*/