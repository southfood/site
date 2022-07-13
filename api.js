const URL = "https://southlandfoodco-op.wixsite.com/website/_functions/";
const API_VERSION = "2.3";
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
    return await API("pricelist");
}

// async function login(data){
//     let url = new URLSearchParams();
//     for(let pair of data){
//         url.append(pair[0], pair[1]);
//     }
//     return await API("login", url);
// }

async function getOrders(uid){
    let url = new URLSearchParams();
    url.append('uid', uid);
    return await API("orderhistory", url);
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

window.addEventListener("beforeinstallprompt", e=>{
    alert('This Website is available as an installable Web Application');
    console.log(e);
    e.preventDefault();
    // e.prompt();
})
