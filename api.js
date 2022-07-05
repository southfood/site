const URL = "https://southlandfoodco-op.wixsite.com/website/_functions/";
const API_VERSION = "2.0";
var wait5sec = new Promise(resolve => {
    window.setTimeout(resolve(), 5000);
});

async function API(functionName="dummy", params = new URLSearchParams(), options={}){
    try{
        let response = await fetch(`${URL}${functionName}?${params.toString()}`, options);
        return await response.json();
    } catch(err){
        return {"error":err.message}
    }
}

async function getAccounts(){
    return await API("accounts");
}

async function getPriceList(){
    return await API("pricelist")
}

async function login(data){
    let url = new URLSearchParams();
    for(let pair of data){
        url.append(pair[0], pair[1]);
    }
    return await API("login", url);
}

async function saveFavourites(uid, favourites){
    let url = new URLSearchParams();
    url.append('uid', uid);
    url.append('favourites', favourites);
    return await API("favourites", url);
}

function alert(message = "!", callback = ()=>{}){
    document.getElementById("alert-dismiss").style.display = null;
    let A = document.getElementById("alert");
    A.querySelector('span').innerHTML = message;
    A.classList.remove('hidden');
    document.getElementById("alert-dismiss").addEventListener("click",callback,{'once':true});
}

function confirm(message = "Error: no input given"){
    let C = document.getElementById("confirm");
    C.querySelector('span').innerHTML = message;
    C.classList.remove('hidden');
    return new Promise(resolve => {
        let clickHandler = e => {
            C.querySelector("#confirm-yes").removeEventListener("click", clickHandler);
            C.querySelector("#confirm-no").removeEventListener("click", clickHandler);
            return resolve(e.target.id == "confirm-yes");
        }
        C.querySelector("#confirm-yes").addEventListener("click", clickHandler);
        C.querySelector("#confirm-no").addEventListener("click", clickHandler);
    });
}

async function order(orderData = {}, instructions=""){
    let url = new URLSearchParams();
    url.append('uid', UserData._id);
    url.append('order', JSON.stringify(orderData));
    url.append('instructions', instructions);
    return await API("order", url);
}

window.addEventListener("beforeinstallprompt",e=>{
    alert('Website available as installable Web Application');
    console.log(e);
    e.preventDefault();
    // e.prompt();
})

// async function email(address = "elliot.mcleish@gmail.com", message = "none"){
//     // let body = new FormData();
//     // body.set("email", address);
//     // body.set("message", message);
//     // let result = await fetch("https://formspree.io/f/meqnwzkd",{
//     //     method:"POST",
//     //     headers:{
//     //         "Content-Type":"multipart/form-data"
//     //     },
//     //     body,
//     // });
//     // console.log(await result.text())
//     // console.log(result);
//     // document.getElementById("self-mailer").submit();
// }

// document.getElementById('contact-form').addEventListener('submit', function(event) {
//     event.preventDefault();
//     // generate a five digit number for the contact_number variable
//     this.contact_number.value = Math.random() * 100000 | 0;
//     // these IDs from the previous steps
//     emailjs.sendForm('contact_service', 'contact_form', this)
//         .then(function() {
//             console.log('SUCCESS!');
//         }, function(error) {
//             console.log('FAILED...', error);
//         });
// });

// var Test = {
//     "abcdefg":3,
//     "alivuh":8,
// };

// Test[Symbol.iterator] = function() {
//     let index = 0; // use index to track properties 
//     let properties = Object.keys(this); // get the properties of the object 
//     let done = false; // set to true when the loop is done 
//     return { // return the next method, need for iterator 
//         next: () => {
//             done = (index >= properties.length);
//             let value = "";
            
//             let id = properties[index];
//             let quantity = this[id];
//             console.log(id, quantity);
            
//             index++; // increment index
//             return {done, value};
//         }
//     };
// }

// Promise.all(Test).then(console.log.bind(console));