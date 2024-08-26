const SCRIPT_VERSION = "2.4";
document.getElementById("version").innerHTML += `script:${SCRIPT_VERSION}&#10240;api:${API_VERSION}&#10240;globals:${GLOBALS_VERSION}`;
const List = document.getElementById("list");
const PriceTemplate = document.getElementById("price-template");
const OrderTemplate = document.getElementById("order-template");
const OrderItemTemplate = document.getElementById("order-item-template");
const Template = document.getElementById("template");
PriceTemplate.id = "";
OrderTemplate.id = "";
OrderItemTemplate.id = "";
Template.id = "";
const Numpad = document.getElementById("numpad");
var SelectedCategory = document.querySelector(".tab.selected");
const PreviewTab = document.querySelector(".tab:last-of-type");
const FavouritesTab = document.querySelector(".tab:first-of-type");
const PreviewInfo = document.getElementById("preview-info");
PreviewInfo.querySelector(".price").replaceWith(PriceTemplate.cloneNode(true));
const SpecialInstructions = document.getElementById("special-instructions");
const FavouritesButton = document.getElementById("favourites-button");
const OrdersButton = document.getElementById("previous-orders-button");
const LoginForm = document.getElementById("login-form");
const UsernameSelect = document.getElementById("username");
const Countdown = document.getElementById("countdown");
const Loading = document.getElementById("loading");
const PlaceOrderButton = document.getElementById("place-order");
const CancelOrderButton = document.getElementById("cancel-order");
const FavouritesCancel = document.getElementById("favourites-cancel");
const Menu = document.getElementById("menu");
const TabsSpacer = document.getElementById("tabs-spacer");
const TabList = document.getElementById("tab-list");
TabsSpacer.appendChild(TabList);
const OrdersDisplay = document.getElementById("orders-background");
const OrdersList = document.getElementById("orders-list");
const OrdersListContent = document.getElementById("orders-list-content");

function login(){
    let accountInfo = JSON.parse(window.localStorage.getItem("account")) || new FormData(LoginForm);
    let username = accountInfo.username || accountInfo.get("username");
    let password = accountInfo.password || accountInfo.get("password");
    let account = AllAccounts[username.toLowerCase()];
    if(!account) return {"error":"Incorrect Username"};
    if(account.password !== password) return {"error":"Incorrect Password"};
    window.localStorage.setItem("account", JSON.stringify({username, password}));
    UserData = account;
    if(!UserData.favourites) UserData.favourites = [];
    document.getElementById("name").innerText = UserData.title;
    document.body.classList.add("logged-in");
    loadList();
    return UserData;
}

async function logout(){
    if(!await confirm("Are you sure you want to Log Out?")) return;
    window.localStorage.clear();
    window.location.reload();
}

Date.prototype.getRawDate = function(){
    return Math.floor(this.valueOf()/(1000*60*60*24));
};

var OrderHistory = [];
async function showOrdersList(){
    OrdersDisplay.classList.remove("hidden");
    if(OrderHistory.length) return;
    showLoading();
    let result = await getOrders(UserData._id);
    Loading.classList.add("hidden");
    if(result.error) return alert(`Error Loading Previous Orders!`, closeOrdersList);
    if(!result.length){
        OrdersListContent.innerHTML = "<h1>Whoops!<br>You haven't made any orders through this website yet!</h1>";
        return;
    }
    // OrdersListContent.innerHTML = "<h3>(Currently limited to 50 items)</h3>"
    OrderHistory = result.items;
    let lastDate = new Date();
    let orderDiv = OrderTemplate.cloneNode(true);
    OrderHistory.forEach((item, i) => {
        let itemDate = new Date(item._createdDate);
        if(itemDate.getRawDate() < lastDate.getRawDate() || !i){
            if(i) OrdersListContent.appendChild(document.createElement("hr"));
            lastDate = itemDate;
            orderDiv = OrderTemplate.cloneNode(true);
            orderDiv.id = `order-${lastDate.getRawDate()}`;
            orderDiv.querySelector('.order-header').innerText = lastDate.toLocaleDateString();
        }
        let id = `order-item-${lastDate.getRawDate()}-${item.itemId}`;
        let alreadyMade = document.getElementById(id);
        if(alreadyMade){
            let itemText = alreadyMade.innerText.split("x");
            let quantity = parseInt(itemText[0]) || 0;
            quantity += item.quantity;
            alreadyMade.innerText = `${quantity}x ${item.item}`;
            return;
        }
        let itemElem = OrderItemTemplate.cloneNode(true);
        itemElem.id = id;
        itemElem.innerText = `${item.quantity}x ${item.item}`;
        itemElem.setAttribute("item-name", item.item);
        let orderItems = orderDiv.querySelectorAll("div.order-item");
        let placeBefore = null;
        for(let i = 0; i < orderItems.length; ++i){
            let testItem = orderItems[i];
            let itemName = testItem.getAttribute("item-name");
            if(itemName.localeCompare(item.item) == 1){
                placeBefore = testItem;
                break;
            }
        }
        if(!placeBefore){
            orderDiv.appendChild(itemElem);
        }else{
            orderDiv.insertBefore(itemElem, placeBefore);
        }
        OrdersListContent.appendChild(orderDiv);
    });
    if(OrderHistory.length == 80 && !OrdersListContent.querySelector(".order").isSameNode(OrdersListContent.lastElementChild)) OrdersListContent.lastElementChild.remove();
}

function closeOrdersList(){
    OrdersDisplay.classList.add('hidden');
}

async function saveOrder(){
    let order = {};
    document.querySelectorAll("li.selected").forEach(li=>{order[li.id]=li.querySelector(".quantity").innerText});
    window.localStorage.setItem("order", JSON.stringify(order));
    console.log("Saved Order");
}

LoginForm.addEventListener("submit", e=>{
    document.getElementById("password").blur();
    e.preventDefault();
    let result = login();
    if(result.error) return alert("Incorrect Username or Password");
});

window.addEventListener("scroll",e=>{
    const TabsBox = TabsSpacer.getBoundingClientRect();
    if(TabsBox.y == -1) return TabsSpacer.style.boxShadow = "0px 0px 12px 3px rgb(0 0 0 / 40%)";
    TabsSpacer.style.boxShadow = null;
})

function favouritesModeToggle(save = false){
    let inFavouritesMode = document.body.classList.contains("favourites-mode");
    if(inFavouritesMode){
        FavouritesButton.innerText = "Edit Favourites";
        document.body.classList.remove("favourites-mode");
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
        document.body.classList.add("favourites-mode");
        FavouritesTab.style.display = "none";
        FavouritesCancel.style.display = "block";
        for(let elem of document.querySelectorAll(".ordering")) elem.style.display = "none";
        closeNumpad(true);
        if(SelectedCategory.isSameNode(PreviewTab) || SelectedCategory.isSameNode(FavouritesTab)){
            FavouritesTab.nextElementSibling.click();
        }
    }
    updateTabs();
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
            return (li, data)=>{
                let tags = data.category || [];
                return tags.includes(category);
            }
    }
}

function updateTabs(){
    const AllTabs = document.querySelectorAll(".tab");
    let allRules = {};
    let allValues = {};

    AllTabs.forEach(tab => {
        let name = tab.innerText.toLowerCase();
        let rule = categoryRule(name);
        allRules[name] = rule;
        allValues[name] = {
            present:0,
            selected:0,
        };
    });

    for(const id in IndexedList){
        const itemData = IndexedList[id];
        const li = document.getElementById(id);
        for(const name in allRules){
            const rule = allRules[name];
            if(!rule(li, itemData)) continue;
            allValues[name].present++;
            const countingClass = document.body.classList.contains("favourites-mode") ? "favourite" : "selected";
            if(li.classList.contains(countingClass))
            allValues[name].selected++;
        }
    }

    AllTabs.forEach(tab => {
        const name = tab.innerText.toLowerCase();
        tab.setAttribute("items-present", allValues[name].present);
        tab.setAttribute("items-selected", allValues[name].selected);
    });

    PreviewTab.setAttribute("items-present", "");
    let disablePreview = document.querySelector("li.selected") ? 'false' : 'true';
    for(const elem of document.querySelectorAll(".ordering")) elem.setAttribute("aria-disabled", disablePreview);
}

document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",e=>{
        if(e.target.isSameNode(SelectedCategory) || e.target.getAttribute('aria-disabled') == 'true') return;
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
        }else{
            saveOrder();
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
    let inFavouritesMode = document.body.classList.contains("favourites-mode");
    let li = findLI(e.target);
    if(inFavouritesMode){
        e.target.checked = !e.target.checked;
        let isFavourite = li.classList.contains("favourite");
        li.classList[isFavourite ? "remove" : "add"]("favourite");
        FavouritesTab.setAttribute('aria-disabled', document.querySelector("li.favourite") ? 'false' : 'true');
        updateTabs();
        return;
    }
    if(Numpad.classList.contains("shown")){
        e.target.checked = !e.target.checked;
        closeNumpad();
        return;
    }
    li.classList[e.target.checked ? "add" : "remove"]("selected");
    updatePrice(li);
    saveOrder();
    updateTabs();
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
    const SavedOrder = JSON.parse(window.localStorage.getItem("order")) || {};
    SpecialInstructions.value = window.localStorage.getItem("instructions");
    PriceList.forEach(item => {
        if(!item.title) return console.warn("empty item", item);
        IndexedList[item._id] = item;
        let newLI = Template.cloneNode(true);
        newLI.id = item._id;
        if(UserData.favourites.includes(item._id)){
            newLI.classList.add('favourite');
            FavouritesTab.setAttribute('aria-disabled', 'false');
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
        if(SavedOrder[item._id]){
            newLI.classList.add("selected");
            newLI.querySelector("input[type=checkbox]").checked = true;
            newLI.querySelector(".quantity").innerText = SavedOrder[item._id];
            updatePrice(newLI);
        }
    });
    FavouritesButton.disabled = false;
    OrdersButton.disabled = false;
    Loading.classList.add("hidden");
    updateTabs();
}

// var doCountdown = false;
Loading.addEventListener("animationiteration",e=>{
    // doCountdown = !doCountdown;
    // if(!doCountdown) return;
    let seconds = parseInt(Countdown.innerText);
    seconds = Math.max(0, seconds-1);
    Countdown.innerText = seconds;
})

function showLoading(){
    Countdown.innerText = "30";
    Loading.classList.remove("hidden");
}

SpecialInstructions.addEventListener("input",e=>{
    window.localStorage.setItem("instructions", SpecialInstructions.value);
})

async function cancelOrder(e, confirmFirst = true){
    if(confirmFirst && !await confirm("Are You sure you want to Cancel your Order?")) return;
    SpecialInstructions.value = "";
    List.querySelectorAll("li.selected").forEach(li=>{
        li.querySelector("input[type=checkbox]").click();
    });
    FavouritesTab.nextElementSibling.click();
    console.log("Removed Order");
}

async function placeOrder(e){
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
    // window.localStorage.removeItem("instructions");
    // window.localStorage.removeItem("order");
    console.log("Order Processed");
    return alert("Order Placed. We will send you an email once we acknowlege your order.", ()=>{
        // window.location.reload();
        cancelOrder(e, false);
    });
}

PlaceOrderButton.addEventListener("click", placeOrder);
CancelOrderButton.addEventListener("click", cancelOrder);

async function loadAccounts(){
    console.log("Attempting to load account Data");
    showLoading();
    let accountsResult = await getAccounts();
    if(accountsResult.error) accountsResult = await getAccounts();
    if(accountsResult.error){
        alert(`Failed to Load Accounts!<br>Click OK to try again.`, loadAccounts);
        return;
    }
    console.log("Account Data Loaded");
    let accounts = accountsResult.items;
    accounts.forEach(account=>{
        AllAccounts[account.title.toLowerCase()] = account;
    });
    document.getElementById("header").classList.remove("hidden");
    Loading.classList.add("hidden");
    let loginResult = login();
    if(!loginResult.error) return;
    LoginForm.querySelector("input[type=submit]").disabled = false;
    document.getElementById("username").focus();
};

loadAccounts();