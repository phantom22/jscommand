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
		else if (typeof value === "boolean") {
			output = formatBool(value);
		}
		else if (typeof value !== "string") {
			try {
				output = "§e§l" + JSON.stringify(value, undefined, 2);

				// if has new lines, then recolor each line separately
				if (output.includes("\n")) {
					output = output.replace(/\n/g,`\n`);
					const lastNewLine = output.lastIndexOf("\n");
					output = output.slice(0,lastNewLine) + "\n§e§l" + output.slice(lastNewLine+1);
				}
			}
			catch (e) {
				output = value.toString();
			}
		}
		else if (value.slice(0,8) === "https://") {
			output = value;
		}
		else output = `§e"§r§o${value}§r§e"§r`;

		return output
	}
	catch (e) {
		return "§c§ocouldn't print output.";
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

function formatBool(value) {
	return `§${value ? "a" : "c"}§l${value}`;
}

function formatGlobalVar(variable) {
	return `§6§l${variable} §r§8= §r§o${formatTypeToString(this[variable])}§r§7;`;
}

function formatOutputForChat(input, output) {
	if (omitFormatToChat) {
		omitFormatToChat = false;
		return output;
	}
	const bar = `§0§l§o${ChatLib.getChatBreak("─")}`;
	return `${bar}\n§b§lInput\n\n${input}\n${bar}\n§9§lOutput\n\n${output}\n${bar}\n`;
}

function safePredict(input,target) {
	return `§6§l${input.slice(0,target.length)}§e§l${target.slice(input.length)}`
}

function unsafePredictBool(input) {
	if (["t","tr","tru","true"].includes(input)) {
		return `§a§l${input}§2§l${"true".slice(input.length)}`
	}
	else if (["f","fa","fal","fals","false"].includes(input)) {
		return `§c§l${input}§4§l${"false".slice(input.length)}`
	}
	else return "§c§o<true|false>";
}

function analyzeInput(input, fromLive) {
	if (!input || Array.isArray(input) && input.length === 0) return fromLive === true && livejs === false ? 14 : 0;

	const key = input[0],
		  value = input[1];
	if (key === "") {
		return fromLive === true && livejs === false ? 14 : 0;
	}
	else if (["t","th","thi"].includes(key) && key !== "this") {
		return 1;
	}
	else if (key === "this" || key.slice(0,4) === "this") {
		return fromLive ? 1 : 2;
	}
	else if (["h","he","hel"].includes(key)) {
		return 3;
	}
	else if (key === "help" || key.slice(0,4) === "help") {
		return fromLive ? 3 : 4;
	}
	else if (["p","pr","pre","pret","prett","pretty","prettyp","prettypr","prettypri","prettyprin"].includes(key)) {
		return 5;
	}
	else if (key === "prettyprint") {
		if (!value) return 5;
		else if (["true","false"].includes(value)) return fromLive ? 7 : 6;
		else return 7;
	}
	else if (["l","li","liv","live","livej"].includes(key)) {
		return 8;
	}
	else if (key === "livejs") {
		if (!value) return 8;
		else if (["true","false"].includes(value)) return fromLive ? 10 : 9;
		else return 10;
	}
	else if (["c","cl","cle","clea","clear"].includes(key) || key.slice(0,4) === "clear") {
		return 11;
	}
	else if (["w","wi","wik"].includes(key)) {
		return 12;
	}
	else if (key === "wiki") {
		if (!value) return 12;
		else return 13
	}
	return !fromLive || livejs ? -1 : 14;
}

function evalJS(toEval, fromLive) {

	try {

		// clear all unnecessary whitespace
		toEval = toEval.filter(v => v !== "");

		const i = analyzeInput(toEval, fromLive),
			vars = Object.keys(this);

		let evaluated;
		switch (i) {
			case 0:
				return "§cno input provided."
			case -1:
				try {
					const input = toEval.join(" ");
					if (vars.includes(input)) {
						return formatGlobalVar(input);
					}
					else if (/^\s*(com|Client|GuiHandler|NBT)|(\=|;|,|\(|\[|{|\+|-|\*|\/|%|<|>|&|\^|\||\?)\s*(com|Client|GuiHandler|NBT)/.test(input)) {
						return "§cinvalid input.";
					}
					else if (!fromLive || fromLive && !/\+=|-=|\*=|\/=|%=|\*\*=|<<=|>>=|>>>=|&=|\^=|\|=|&&=|\|\|=|\?\?=/.test(input)) 
						/* binding this helps with function declarations: now 
						function name () {
							...
						}
						actually stores the function into this[name]
					
						*/
						evaluated = eval.call(this,input);
					else {
						toEvalOnCommand = true;
						return "§lhit enter to evaluate the input because it contains shorthand assignments that can cause unwanted results."
					}
				}
				catch (e) {
					evaluated = `§c§o${e.toString()}`;
				}
				break;
			case 1:
				toEvalOnCommand = true;
				return `${safePredict(toEval[0],"this")}§r §8- §7§olists all the global variables.`;
			case 2:
				const varsToOmit = ["require","exports","module","prevInput","formatTypeToString","formatNumber","formatBool","evalJS","formatOutputForChat","prevLiveMsg","commandMessage","liveMessage","formatGlobalVar","analyzeInput","safePredict","unsafePredictBool","toEvalOnCommand","omitFormatToChat"]; // List of all the variable names that should be hidden when calling the command /js this
				evaluated = ["§d§llocal variables\n"];

				for (let i=0; i<vars.length; i++) {
					const variable = vars[i];
					if (!varsToOmit.includes(variable)) {
						evaluated.push(formatGlobalVar(variable));
					}
				}

				return evaluated.join("\n");
			case 3:
				toEvalOnCommand = true;
				return `${safePredict(toEval[0],"help")}§r §8- §7§odisplays useful info.`;
			case 4:
				const bar = `§b§l§o${ChatLib.getChatBreak("─")}`;
				omitFormatToChat = true;
				return `${bar}\n§a/js <javascript> §7- §owhile typing out the code its real-time evaluation will be shown in the chat; can also be used as a command.\n§a/js clear §7- §oclears the chat from all the outputs of the /js command.\n§a/js this §7- §olists all the global variables.\n§a/js prettyprint <true|false> §7- §owhen true, all numbers that are shown in chat will be written in shorthand.\n§a/js livejs <true|false> §7- §owhen true, auto-evaluate javascript in real-time while typing the /js command.\n§a/js wiki <query>§r §7- §osends the link to the specified query.\n§a/js help §7- §odisplays this message.\n${bar}`;
			case 5:
				return `${safePredict(toEval[0],"prettyprint")}§r ${formatBool(prettyprint)}§r §8- §7§owhen true, all numbers that are shown in chat will be written in shorthand.`;
			case 6:
				prettyprint = toEval[1] === "true";
				return `${safePredict(toEval[0],"prettyprint")}§r ${formatBool(prettyprint)}§r §8- §7§owhen true, all numbers that are shown in chat will be written in shorthand.`;
			case 7:
				toEvalOnCommand = true;
				return `${safePredict(toEval[0],"prettyprint")}§r ${unsafePredictBool(toEval[1])}§r §8- §7§owhen true, all numbers that are shown in chat will be written in shorthand.`
			case 8:
				return `${safePredict(toEval[0],"livejs")}§r ${formatBool(livejs)}§r §8- §7§owhen true, auto-evaluate javascript in real-time while typing the /js command.`;
			case 9:
				livejs = toEval[1] === "true";
				return `${safePredict(toEval[0],"livejs")}§r ${formatBool(livejs)}§r §8- §7§owhen true, auto-evaluate javascript in real-time while typing the /js command.`;
			case 10:
				toEvalOnCommand = true;
				return `${safePredict(toEval[0],"livejs")}§r ${unsafePredictBool(toEval[1])}§r §8- §7§owhen true, auto-evaluate javascript in real-time while typing the /js command.`;
			case 11:
				return `${safePredict(toEval[0],"clear")}§r §8- §7§oclears the chat from all the outputs of the /js command.`;
			case 12:
				return `${safePredict(toEval[0],"wiki")}§r §a§o<query>§r §8- §7§osends the link to the specified query.`;
			case 13:
				return `https://wiki.hypixel.net/index.php?search=${toEval[1].replaceAll(" ","+")}&title=Special%3ASearch`;
			case 14:
				toEvalOnCommand = true;
				return "";

		}

		return formatTypeToString(evaluated);

	}
	catch (e) {
		return "§ccouldn't evaluate input."
	}

}

function liveMessage(text) {
	const msg = new Message(text);
	msg.setChatLineId(94358);
	ChatLib.chat(msg);

	if (toEvalOnCommand) prevLiveMsg = "";
	else prevLiveMsg = text;

	toEvalOnCommand = false;
}

let livejs = true,
	prevInput = "",
	prevLiveMsg = "",
	toEvalOnCommand = false,
	omitFormatToChat = false;
register("tick", () => {
	if (Client.isInChat()) {
		const msg = Client.getCurrentChatMessage();

		// evaluate only once in a row each user input.
		if (msg === prevInput)
			return;

		prevInput = msg;

		if (msg.slice(0,4) === "/js ") {
			
			const input = msg.slice(4).trim(),
				  output = evalJS(input.split(" "), true)

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
	toEvalOnCommand = false;
}

register("command", (...input) => {
	if (input[0] === "clear") {
		ChatLib.deleteChat(94358); // live messages
		ChatLib.deleteChat(94360); // command messages
		commandMessage("§8The chat was succesfully cleared.");
	}
	/* 
		Prevent the code from being executed two times in a row, especially for functions like
			myArray.push(...)
	*/
	else if (livejs === true && prevLiveMsg !== "") {
		ChatLib.deleteChat(94358);
		commandMessage(prevLiveMsg);
		prevLiveMsg = "";
	}
	else {
		const output = evalJS(input, false);

		if (output) {
			ChatLib.deleteChat(94358);
			const text = formatOutputForChat(input.join(" "),output);
			commandMessage(text)
		}
	}
}).setName("js");