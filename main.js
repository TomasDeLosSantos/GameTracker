window.addEventListener('load', () => {
    const form = document.querySelector("#new-game");
    const input = document.querySelector("#new-game-name");
    const pending__list = document.querySelector("#pending");
    const pending__title = document.querySelector("#pending__title");
    const completed__list = document.querySelector("#completed");
    const completed__title = document.querySelector("#completed__title");
    let card__array = [];
    let today = new Date();
    
    
    load();


    pending__title.querySelector("span").innerText = pending__list.querySelectorAll(".card").length;
    completed__title.querySelector("span").innerText = completed__list.querySelectorAll(".card").length;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const game = input.value;
        pending__list.appendChild(createCard(game));
        addGame();
        form.reset();
    });

    document.addEventListener("click", (e) => {
        if(e.target && e.target.matches("i.delete__btn")){
            e.target.parentElement.parentElement.parentElement.remove();
            addGame();
        }
        if(e.target && e.target.matches("i.edit__btn")){
            const gameName = e.target.parentElement.parentElement.querySelector(".text");
            if(e.target.classList.contains("fa-pencil")){
                e.target.classList.replace("fa-pencil", "fa-check");
                gameName.removeAttribute("readonly");
                gameName.focus();
            } else{
                e.target.classList.replace("fa-check", "fa-pencil");
                gameName.setAttribute("readonly", "readonly");
            }
        }
        if(e.target && e.target.matches("button.save__btn")){
            save();
        }
    });

    document.getElementById("pending").addEventListener("click", (e) => {
        if(e.target && e.target.matches("i.card__status")){
            if(!e.target.parentElement.classList.contains("completed")){
                e.target.parentElement.querySelector(".card__para").innerText += " | Completado el "+ today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
                completed__list.appendChild(e.target.parentElement);
                e.target.parentElement.classList.add("completed");
                addGame();
                //addGame(1, "completed");
            }
        }
    });

    document.getElementById("completed").addEventListener("click", (e) => {
        if(e.target && e.target.matches("i.card__status")){
            if(e.target.parentElement.classList.contains("completed")){
                e.target.parentElement.querySelector(".card__para").innerText = e.target.parentElement.querySelector(".card__para").innerText.split("|")[0];
                pending__list.appendChild(e.target.parentElement);
                e.target.parentElement.classList.remove("completed");
                addGame();
                //addGame(-1, "completed");
            }
        }
    });


    /*
        Esta función crea las cartas, cuya estructura HTML es:
        <article class="card">
            <i class="fa-solid fa-check card__status"></i>
            <div class="card__row">
                <div class="card__data">
                    <h3 class="card__title"> NOMBRE DE JUEGO </h3>
                    <p class="card__para"> INFORMACIÓN SOBRE JUEGO </p>
                </div>
                <div class="card__btns">
                    <i class="fa-solid fa-pencil edit__btn"></i>
                    <i class="fa-solid fa-trash delete__btn"></i>
                </div>
            </div>
        </article>
    */
    function createCard(name, para = "data"){
        const newCard = document.createElement("article");
        newCard.classList.add("card");
        const status = document.createElement("i");
        status.classList.add("fa-solid","fa-check","card__status");
        newCard.appendChild(status);
        const row = document.createElement("div");
        row.classList.add("card__row");
        newCard.appendChild(row);
        const data = document.createElement("div");
        data.classList.add("card__data");
        const title = document.createElement("input");
        title.setAttribute("type", "text");
        title.setAttribute("value", name);
        title.setAttribute("size", "30")
        title.setAttribute("readonly", "readonly");
        title.classList.add("text");
        const info = document.createElement("p");
        info.innerText = para;
        info.classList.add("card__para");
        data.appendChild(title);
        data.appendChild(info);
        row.appendChild(data);
        const btns = document.createElement("div");
        btns.classList.add("card__btns");
        const edit = document.createElement("i");
        edit.classList.add("fa-solid", "fa-pencil", "edit__btn");
        const del = document.createElement("i");
        del.classList.add("fa-solid", "fa-trash", "delete__btn");
        btns.appendChild(edit);
        btns.appendChild(del);
        row.appendChild(btns);
        newCard.appendChild(row);
        return newCard;
    }

    function addGame(){
        pending__title.querySelector("span").innerText = pending__list.querySelectorAll(".card").length;
        completed__title.querySelector("span").innerText = completed__list.querySelectorAll(".card").length;
    }

    function save(){
        const allCards = document.getElementsByClassName("card");
        for(let card of allCards){
            const name = card.querySelector("input").value;
            const info = card.querySelector(".card__para").innerText;
            const completed = card.classList.contains("completed");
            if(!(card__array.some(i => i.cardName == name))){
                card__array.push({cardName: name, info: info, completed: completed});
            }
        }
        let noCardName = card__array.map((e) => {
            for(let i = 0; i < allCards.length;i++){
                if(e.cardName == allCards[i].querySelector("input").value){
                    return false;
                }
            }
            return true;
        });
        while(noCardName.indexOf(true) != -1){
            card__array = card__array.filter(e => e.cardName != (card__array[(noCardName.indexOf(true))].cardName));
            noCardName = noCardName.filter(e => noCardName.indexOf(e) != noCardName.indexOf(true));
        }
        localStorage.setItem("cards", JSON.stringify(card__array));
        //localStorage.setItem("pending", pending__games);
        //localStorage.setItem("completed", completed__games);
    }
    function load(){
        const cards = JSON.parse(localStorage.getItem("cards"));
        if(cards != undefined){
            for(let card of cards){
                if(card.completed){
                    const newCard = createCard(card.cardName, card.info);
                    newCard.classList.add("completed");
                    completed__list.appendChild(newCard);
                } else{
                    pending__list.appendChild(createCard(card.cardName, card.info));
                }
            }
        }
    }
    
});