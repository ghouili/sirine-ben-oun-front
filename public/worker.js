let array = [];
window.self.addEventListener("message", event => {
    if (event.data === "download") {
        const blob = new Blob(array);
        window.self.postMessage(blob);
        array = [];
    } else {
        array.push(event.data);
    }
})
