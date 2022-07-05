const SCRIPT_VERSION = "2.0";
document.getElementById("version").innerHTML += `script:${SCRIPT_VERSION}&#10240;api:${API_VERSION}&#10240;globals:${GLOBALS_VERSION}`;
const List = document.getElementById("list");
const PriceTemplate = document.getElementById("price-template");
const Template = document.getElementById("template");
PriceTemplate.id = "";
Template.id = "";
const Numpad = document.getElementById("numpad");
var SelectedCategory = document.querySelector(".tab.selected");
const PreviewTab = document.querySelector(".tab:last-of-type");
const FavouritesTab = document.querySelector(".tab:first-of-type");
const PreviewInfo = document.getElementById("preview-info");
PreviewInfo.querySelector(".price").replaceWith(PriceTemplate.cloneNode(true));
const SpecialInstructions = document.getElementById("special-instructions");
const FavouritesButton = document.getElementById("favourites-button");
const LoginForm = document.getElementById("login-form");
const UsernameSelect = document.getElementById("username");
const Countdown = document.getElementById("countdown");
const Loading = document.getElementById("loading");
const PlaceOrderButton = document.getElementById("place-order");
const FavouritesCancel = document.getElementById("favourites-cancel");

async function login(data){
    let username = data.get('username');
    let password = data.get('password');
    let account = AllAccounts[username.toLowerCase()];
    if(!account) return {"error":"Incorrect Username"};
    return account.password == password ?account:{"error":"Incorrect Password"};
}

LoginForm.addEventListener("submit",async e=>{
    document.getElementById("password").blur();
    e.preventDefault();
    let data = new FormData(LoginForm);
    // LoginForm.querySelector("input[type=submit]").disabled = true;
    let result = await login(data);
    if(result.error) return alert("Incorrect Username or Password");
    // LoginForm.querySelector("input[type=submit]").disabled = false;
    /*if(result.error == 'Failed to fetch') result = await login(data);
    if(result.error == "Incorrect Password") return alert("Incorrect Password!");
    if(result.error) return alert("Failed to Log In!");*/
    UserData = result;
    if(!UserData.favourites) UserData.favourites = [];
    document.getElementById("name").innerText = UserData.title;
    document.body.classList.add("logged-in");
    loadList();
});

function favouritesModeToggle(save = false){
    let inFavouritesMode = List.classList.contains("favourites-mode");
    if(inFavouritesMode){
        FavouritesButton.innerText = "Edit Favourites";
        List.classList.remove("favourites-mode");
        FavouritesTab.style.display = null;
        for(let elem of document.querySelectorAll(".ordering")) elem.style.display = null;
        FavouritesCancel.style.display = "none";
        if(save){
            UserData.favourites = [];
            document.querySelectorAll("li.favourite").forEach(li=>{UserData.favourites.push(li.id)});
            saveFavourites(UserData._id, UserData.favourites).then(result=>{
                if(result.error) return alert("Favourites Failed to Save!<br>Click Edit Favourites > Save Favourites to try again.");
                console.log("Favouries Saved Successfully");
            })
        }else{
            for(let li of List.children){
                li.classList[UserData.favourites.includes(li.id) ? 'add' : 'remove']('favourite');
            }
        }
    }else{
        FavouritesButton.innerText = "Save Favourites";
        List.classList.add("favourites-mode");
        FavouritesTab.style.display = "none";
        FavouritesCancel.style.display = "block";
        for(let elem of document.querySelectorAll(".ordering")) elem.style.display = "none";
        closeNumpad(true);
        if(SelectedCategory.isSameNode(PreviewTab) || SelectedCategory.isSameNode(FavouritesTab)){
            FavouritesTab.nextElementSibling.click();
        }
    }
}

function categoryRule(category){
    switch(category){
        case 'favourites':
            return (li)=>{return li.classList.contains('favourite')};
        case 'all':
            return ()=>{return true};
        case 'review order':
            return (li)=>{return li.classList.contains('selected')};
        default:
            return (li, data)=>{return data.category.includes(category);}
    }
}

document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",e=>{
        if(e.target.isSameNode(SelectedCategory) || e.target.ariaDisabled == 'true')return;
        e.target.classList.add("selected");
        if(SelectedCategory) SelectedCategory.classList.remove("selected");
        SelectedCategory = e.target;
        PreviewInfo.classList[(SelectedCategory.isSameNode(PreviewTab))?'add':'remove']("shown")
        let rule = categoryRule(SelectedCategory.innerText.toLowerCase());
        for(let id in IndexedList){
            let itemData = IndexedList[id];
            let li = document.getElementById(id);
            li.classList[rule(li, itemData) ? 'remove' : 'add']('hidden');
        }
        if(Numpad.classList.contains("shown")){
            let li = findLI(List.querySelector('.quantity.selected'));
            if(!li) return;
            if(li.classList.contains('hidden')) closeNumpad(true);
        }
    });
});

function closeNumpad(reset = false){
    Numpad.classList.remove("shown");
    let quantity = List.querySelector(".quantity.selected");
    let ifok = Numpad.querySelector(".ifok");
    let ifcancel = Numpad.querySelector(".ifcancel");
    if(quantity){
        quantity.classList.remove("selected");
        if(reset){
            quantity.innerText = ifcancel.innerText;
            updatePrice(findLI(quantity));
        }
    }
    if(ifok) ifok.classList.remove("ifok");
    if(ifcancel) ifcancel.classList.remove("ifcancel");
}

function openNumpad(quantity){
    let num = quantity.innerText;
    let defaultNum = Numpad.querySelector("#num"+num);
    if(!defaultNum) return;
    Numpad.classList.add("shown");
    defaultNum.classList.add("ifcancel");
    quantity.classList.add("selected");
    Numpad.querySelector("#numpad-ok").disabled = true;
}

function findLI(elem){
    while(elem.tagName != 'LI'){
        elem = elem.parentElement;
        if(document.body.isSameNode(elem)) return null;
    }
    return elem;
}

function selectionHandler(e){
    let inFavouritesMode = List.classList.contains("favourites-mode");
    let li = findLI(e.target);
    if(inFavouritesMode){
        e.target.checked = !e.target.checked;
        let isFavourite = li.classList.contains("favourite");
        li.classList[isFavourite ? "remove" : "add"]("favourite");
        FavouritesTab.ariaDisabled = document.querySelector("li.favourite") ? 'false' : 'true';
        return;
    }
    if(Numpad.classList.contains("shown")){
        e.target.checked = !e.target.checked;
        closeNumpad();
        return;
    }
    li.classList[e.target.checked ? "add" : "remove"]("selected");
    updatePrice(li);
    let disablePreview = document.querySelector("li.selected") ? 'false' : 'true'
    for(let elem of document.querySelectorAll(".ordering")) elem.ariaDisabled = disablePreview;
}

function quantityHandler(e){
    if(Numpad.classList.contains("shown")){
        closeNumpad();
        return;
    }
    let li = findLI(e.target);
    let alreadySelected = li.classList.contains("selected");
    if(!alreadySelected) li.querySelector("input[type=checkbox]").click();
    openNumpad(li.querySelector(".quantity"));
}

document.body.addEventListener("click",e=>{
    if(e.target.isSameNode(document.body) && Numpad.classList.contains("shown")) closeNumpad(true);
});

function updatePrice(li){
    let priceElem = li.querySelector('.finalprice');
    if(!priceElem) return;
    let quantityElem = li.querySelector('.quantity') || {innerText:'10'};
    let quantity = parseInt(quantityElem.innerText);
    let itemData = IndexedList[li.id] || {price:99.99};
    let priceString = getPriceString(itemData.price * quantity);
    priceElem.querySelector(".dollars").innerText = priceString[0];
    priceElem.querySelector(".cents").innerText = priceString[1];
    let totalCents = 0;
    document.querySelectorAll('li.selected .quantity').forEach(quantElem=>{
        let li = findLI(quantElem);
        let quantity = parseInt(quantElem.innerText) || 0;
        let itemData = IndexedList[li.id];
        totalCents += Math.round(quantity*itemData.price*100);
    });
    let totalPriceString = getPriceString(totalCents/100);
    PreviewInfo.querySelector(".dollars").innerText = totalPriceString[0];
    PreviewInfo.querySelector(".cents").innerText = totalPriceString[1];
}

Numpad.addEventListener("click",e=>{
    if(!e.target.id) return;
    let idInfo = e.target.id.match(/num(\d+)/);
    if(!idInfo) return;
    Numpad.querySelector("#numpad-ok").disabled = false;
    let selected = Numpad.querySelector(".ifok");
    if(selected) selected.classList.remove("ifok");
    e.target.classList.add("ifok");
    let selectedQuantity = List.querySelector(".quantity.selected");
    if(selectedQuantity){
        selectedQuantity.innerText = idInfo[1];
        updatePrice(findLI(selectedQuantity));
    }
    e.stopPropagation();
});

function getPriceString(price){
    price+=0.001;
    let priceString = price.toString().split('.');
    if(!priceString[1]) priceString[1] = '00';
    while(priceString[1].length < 2) priceString[1]+='0';
    priceString[1] = priceString[1].slice(0,2);
    return priceString;
}

function createPriceElem(price){
    let elem = PriceTemplate.cloneNode(true);
    let priceString = getPriceString(price);
    elem.querySelector(".dollars").innerText = priceString[0];
    elem.querySelector(".cents").innerText = priceString[1];
    return elem;
}

async function loadList(){
    console.log("Attempting to Load Price List...");
    showLoading();
    let result = await getPriceList();
    console.log("First Load Attempt Complete", result.error);
    if(result.error){
        result = await getPriceList();
        console.log("Second Load Attempt Complete", result.error);
        if(result.error){
            alert(`Failed to Load Price List!<br>Click OK to try again.`, loadList);
            return;
        }
    }
    console.log("Load Successful");
    PriceList = result.items;
    PriceList.forEach(item => {
        IndexedList[item._id] = item;
        let newLI = Template.cloneNode(true);
        newLI.id = item._id;
        if(UserData.favourites.includes(item._id)){
            newLI.classList.add('favourite');
            FavouritesTab.ariaDisabled = 'false';
        }
        newLI.querySelector("label").setAttribute("for","selector"+item._id);
        newLI.querySelector("label").insertAdjacentText('beforeEnd',item.title);
        newLI.querySelector("input[type=checkbox]").setAttribute("id","selector"+item._id);
        newLI.querySelector("input[type=checkbox]").addEventListener("input",selectionHandler);
        newLI.querySelector(".order-info").addEventListener("click",quantityHandler);
        let finalPrice = null;
        newLI.querySelectorAll(".price").forEach(price=>{
            finalPrice = createPriceElem(item.price)
            price.replaceWith(finalPrice);
        });
        finalPrice.classList.add('finalprice');
        List.appendChild(newLI);
    });
    FavouritesButton.disabled = false;
    Loading.classList.add("hidden");
}

var doCountdown = false;
Loading.addEventListener("animationiteration",e=>{
    doCountdown = !doCountdown;
    if(!doCountdown) return;
    let seconds = parseInt(Countdown.innerText);
    seconds = Math.max(0, seconds-1);
    Countdown.innerText = seconds;
})

function showLoading(){
    Countdown.innerText = "30";
    Loading.classList.remove("hidden");
}

PlaceOrderButton.addEventListener("click",async e=>{
    if(!await confirm("Are You sure you want to place your Order?")) return;
    console.log("Processing Order");
    alert("Processing...");
    document.getElementById("alert-dismiss").style.display = "none";
    var ORDER = {};
    for(let item of document.querySelectorAll("li.selected")){
        ORDER[item.id] = parseInt(item.querySelector(".quantity").innerText);
    }
    let result = await order(ORDER, SpecialInstructions.value);
    if(result.error){
        console.error(result.error);
        return alert("Error placing Order!");
    }
    console.log();
    return alert("Order Placed. We will send you an email once we acknowlege your order.", ()=>{window.location.reload()});
});

async function loadAccounts(){
    console.log("Attempting to load account Data");
    showLoading();
    let result = await getAccounts();
    if(result.error) result = await getAccounts();
    if(result.error){
        alert(`Failed to Load Accounts!<br>Click OK to try again.`, loadAccounts);
        return;
    }
    console.log("Account Data Loaded");
    let accounts = result.items;
    accounts.forEach(account=>{
        AllAccounts[account.title.toLowerCase()] = account;
        /*let option = document.createElement("option");
        option.value = account._id;
        option.innerText = account.title;
        UsernameSelect.appendChild(option);*/
    });
    document.getElementById("header").classList.remove("hidden");
    Loading.classList.add("hidden");
    LoginForm.querySelector("input[type=submit]").disabled = false;
    document.getElementById("username").focus();
};

loadAccounts();