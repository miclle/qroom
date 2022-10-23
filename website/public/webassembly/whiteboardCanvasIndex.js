function addScript(url, isModule) {
	let script = document.createElement('script')
	script.src = url
	if (isModule) script.type = 'module'
	document.documentElement.appendChild(script)
}
whiteboard.controller.initialize()
whiteboard.controller.mountCanvas('canvasBox')

addScript('./whiteboard_webassembly.js', false)

whiteboard.controller.onMessage()
