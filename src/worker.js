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


// let typedArray = null;

// window.self.addEventListener("message", event => {
//     if (event.data === "download") {
//         const blob = new Blob([typedArray], { type: "application/octet-stream" });
//         window.self.postMessage(blob);
//         typedArray = null;
//     } else {
//         if (typedArray === null) {
//             typedArray = event.data;
//         } else {
//             // Merge the new typed array into the existing one
//             const newTypedArray = event.data;
//             const mergedTypedArray = new typedArray.constructor(
//                 typedArray.length + newTypedArray.length
//             );
//             mergedTypedArray.set(typedArray);
//             mergedTypedArray.set(newTypedArray, typedArray.length);
//             typedArray = mergedTypedArray;
//         }
//     }
// });