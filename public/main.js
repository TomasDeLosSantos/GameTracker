// WAIT FOR PAGE TO LOAD BEFORE EXECUTING JS
window.addEventListener('load', () => {

    if (JSON.parse(localStorage.getItem("cards")) == undefined) localStorage.setItem("cards", JSON.stringify([]));
    const form = document.querySelector("#new-game");
    const input = document.querySelector("#new-game-name");
    const pending__list = document.querySelector("#pending");
    const pending__title = document.querySelector("#pending__title");
    const completed__list = document.querySelector("#completed");
    const completed__title = document.querySelector("#completed__title");
    const login__btn = document.querySelector(".login");
    const logout__btn = document.querySelector(".logout");
    const signIn = document.querySelector(".header__link");
    let card__array = [];
    let today = new Date();
    let hide = false;
    let userGames = [];
    let appCompletion = 0;
    let gameList = [];
    let ALLGAMELIST = false;
    let STEAMID;


    const req = new XMLHttpRequest();
    let url = "https://gametracker-js.herokuapp.com/steamid";
    req.open("GET", url, true);
    req.addEventListener("load", () => {
        req.status >= 200 && req.status < 400 ? (
            req.response != "ACCOUNT NOT CONNECTED" ? (
                localStorage.setItem("STEAMID", JSON.stringify(req.response)),
                STEAMID = req.response,
                login__btn.style.display = "none",
                logout__btn.style.display = "block",
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    color: "#17181F",
                    icon: 'success',
                    title: 'Cuenta conectada correctamente',
                    showConfirmButton: false,
                    timer: 3000
                }),
                getUserGames(STEAMID)
            ) : (
                localStorage.setItem("STEAMID", JSON.stringify(req.response)),
                STEAMID = req.response,
                login__btn.style.display = "block",
                logout__btn.style.display = "none",
                ALLGAMELIST = false,
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    color: "#17181F",
                    icon: 'warning',
                    iconColor: "tomato",
                    title: 'Su cuenta de Steam no est?? conectada',
                    showConfirmButton: false,
                    timer: 3000
                }),
                load()
            )
        ) : (
            console.log("error")
        );
    });
    req.send(null);

    // STEAM DATA
    // get user games (appid) and playtime (playtime_forever)
    // get user achievements completion (for each appid??)
    function getUserGames(steamuid) {
        const req = new XMLHttpRequest();
        let url = "https://gametracker-js.herokuapp.com/userGames/?steamuid=" + steamuid;
        req.open("GET", url, true);
        req.addEventListener("load", () => {
            req.status >= 200 && req.status < 400 ? (
                userGames = JSON.parse(req.responseText),
                getAllGames()
            ) : console.log("Error in network request: " + req.statusText);
        });
        req.send(null);
    }

    function getAllGames() {
        fetch("gameList.json")
            .then(response => {
                return response.json();
            })
            .then(data => {
                //console.log(data.applist.apps);
                gameList = data.applist.apps;
                for (let game of userGames) {
                    const gam = gameList.find(g => g.appid == game.appid);
                    if (gameList.some(g => g.appid == game.appid)) {
                        game.name = gameList[gameList.findIndex(g => g.appid == game.appid)].name;
                    }
                    getGameAchievements(game.appid, game);
                }
                ALLGAMELIST = true;
                load();
            })
            .catch((e) => {
                console.log("Error in network request: " + e);
            });
    }

    function getGameAchievements(appid, game) {
        const req = new XMLHttpRequest();
        let url = "https://gametracker-js.herokuapp.com/gameAchievements/?appid=" + appid;
        req.open("GET", url, true);
        req.addEventListener("load", () => {
            req.status >= 200 && req.status < 400 ? (
                JSON.parse(req.responseText).game.availableGameStats?.hasOwnProperty("achievements") ? game.hasAchievements = true : null
            ) : console.log("error");
        });
        req.send(null);
    }

    function userCompletion(appid, game) {
        return new Promise((resolve) => {
            const req = new XMLHttpRequest();
            let url = "https://gametracker-js.herokuapp.com/userAchievements/?appid=" + appid + "&steamuid=" + STEAMID;
            req.open("GET", url, true);
            req.addEventListener("load", () => {
                if (req.status >= 200 && req.status < 400) {
                    let response = JSON.parse(req.responseText);
                    let achieved = 0;
                    for (let achievement of response.achievements) {
                        if (achievement.achieved == 1) {
                            achieved++;
                        }
                    }
                    appCompletion = Math.round((achieved / response.achievements.length) * 100);
                    game.userCompletion = appCompletion;
                    achieved = 0;
                    resolve();
                } else {
                    console.log("error");
                }
            });
            req.send(null);
        });
    }
    STEAMID == "ACCOUNT NOT CONNECTED" || STEAMID == 0 || STEAMID == undefined ? load() : getUserGames(STEAMID);

    /*
        Esta funci??n crea las cartas, cuya estructura HTML es:
        <article class="card">
            <i class="fa-solid fa-check card__status"></i>
            <div class="card__row">
                <div class="card__data">
                    <input type="text" class="text" value=" NOMBRE DE JUEGO " readonly>
                    <p class="card__para"> INFORMACI??N SOBRE JUEGO </p>
                </div>
                <div class="card__btns">
                    <i class="fa-solid fa-pencil edit__btn"></i>
                    <i class="fa-solid fa-trash delete__btn"></i>
                </div>
            </div>
        </article>
        */

    function createCard(name, para = "Account not connected", completed = false) {
        const newCard = document.createElement("article");
        newCard.classList.add("card");
        const status = document.createElement("i");
        status.classList.add("fa-solid", "fa-check", "card__status");
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
        // IF NOT CONNECTED, "ACCOUNT NOT CONNECTED"
        // IF CONNECTED:
        // NAME INTO APPID
        // LOOK FOR GAME IN STEAM DATA
        // IF PRESENT, LOAD DATA
        // IF NOT, "NOT IN LIBRARY"
        if (ALLGAMELIST) {
            if (userGames.some(g => g.name == name)) {
                let card = card__array.find(c => c.cardName == name);
                let i = userGames[userGames.findIndex(g => g.name == name)];
                userCompletion(i.appid, i).then(() => {
                    if (completed) {
                        para = Math.round(i.playtime_forever / 60) + "Hs - " + i.userCompletion + "%" + " | Completado el " + card.date;
                    } else {
                        para = Math.round(i.playtime_forever / 60) + "Hs - " + i.userCompletion + "%";
                    }
                    info.innerText = para;
                })
            } else {
                para = "Not in library";
                info.innerText = para;
            }
        } else {
            para = "Account not connected";
            info.innerText = para;
        }
        info.classList.add("card__para");
        data.appendChild(title);
        data.appendChild(info);
        row.appendChild(data);
        // const btns = document.createElement("div");
        // btns.classList.add("card__btns");
        const del = document.createElement("i");
        del.classList.add("fa-solid", "fa-trash", "delete__btn");
        // btns.appendChild(del);
        // row.appendChild(btns);
        row.appendChild(del);
        newCard.appendChild(row);
        return newCard;
    }

    function addGame() {
        pending__title.querySelector("span").innerText = pending__list.querySelectorAll(".card").length;
        completed__title.querySelector("span").innerText = completed__list.querySelectorAll(".card").length;
    }

    function save() {
        const allCards = document.getElementsByClassName("card");
        for (let card of allCards) {
            const name = card.querySelector("input").value;
            const info = card.querySelector(".card__para").innerText;
            const completed = card.classList.contains("completed");
            !(card__array.some(i => i.cardName == name)) ? card__array.push({ cardName: name, info: info, completed: completed }) : (
                completed ? card__array[card__array.findIndex(c => c.cardName == name)].completed = true : card__array[card__array.findIndex(c => c.cardName == name)].completed = false
            );
        }
        let noCardName = card__array.map((e) => {
            for (let i = 0; i < allCards.length; i++) {
                if (e.cardName == allCards[i].querySelector("input").value) {
                    return false;
                }
            }
            return true;
        });
        while (noCardName.indexOf(true) != -1) {
            card__array = card__array.filter(e => e.cardName != (card__array[(noCardName.indexOf(true))].cardName));
            noCardName = noCardName.filter(e => noCardName.indexOf(e) != noCardName.indexOf(true));
        }
        localStorage.setItem("cards", JSON.stringify(card__array));
    }

    function load() {
        let child = pending__list.querySelector(".card");
        while (child) {
            pending__list.removeChild(child);
            child = pending__list.querySelector(".card");
        }
        child = completed__list.querySelector(".card");
        while (child) {
            completed__list.removeChild(child);
            child = completed__list.querySelector(".card");
        }
        const cards = JSON.parse(localStorage.getItem("cards"));
        card__array = cards;
        if (cards != undefined) {
            for (let card of cards) {
                let { cardName, info, completed } = card;
                if (completed) {
                    const newCard = createCard(cardName, info, true);
                    newCard.classList.add("completed");
                    completed__list.appendChild(newCard);
                } else {
                    pending__list.appendChild(createCard(cardName, info, false));
                }
            }
        }
    }

    pending__title.querySelector("span").innerText = pending__list.querySelectorAll(".card").length;
    completed__title.querySelector("span").innerText = completed__list.querySelectorAll(".card").length;


    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const game = input.value;
        pending__list.appendChild(createCard(game));
        addGame();
        save();
        form.reset();
    });

    const new_game_list = document.querySelector("#new-game-list");

    const searchGame = (game) => {
        const regex = new RegExp(`^${game}`, "gi");
        let matches = userGames.filter(g => g.name != undefined && g.name.match(regex));
        input === document.activeElement || form === document.activeElement ? (
            new_game_list.style.visibility = "visible",
            showMatches(matches)
        ) : null;
    };

    const showMatches = (matches) => {
        if (ALLGAMELIST) {
            if (matches.length > 0) {
                let child = new_game_list.lastElementChild;
                while (child) {
                    new_game_list.removeChild(child);
                    child = new_game_list.lastElementChild;
                }
                for (let m of matches) {
                    const match = document.createElement("h2");
                    match.classList.add("input__match");
                    match.innerText = m.name;
                    new_game_list.appendChild(match);
                }
            } else {
                for (let g of userGames) {
                    const match = document.createElement("h2");
                    match.classList.add("input__match");
                    match.innerText = g.name;
                    new_game_list.appendChild(match);
                }
            }
        }
    }

    input.addEventListener("input", () => searchGame(input.value));

    document.addEventListener("click", (e) => {
        e.target && e.target.matches("i.delete__btn") ? (
            Swal.fire({
                title: 'Est??s a punto de eliminar el juego de la lista',
                text: "No se puede revertir!",
                icon: 'warning',
                color: "#fff",
                iconColor: "tomato",
                background: "#17181F",
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#20212C',
                cancelButtonText: "Cancelar",
                confirmButtonText: 'Borrar'
            }).then((result) => {
                if (result.isConfirmed) {
                    e.target.parentElement.parentElement.remove();
                    addGame();
                    save();
                    Swal.fire({
                        title: 'Listo!',
                        text: 'El juego se elimin?? con ??xito.',
                        icon: 'success',
                        color: "#fff",
                        background: "#17181F",
                        confirmButtonColor: "#42533e"

                    });
                }
            })
        ) : null;

        e.target && e.target.matches("h2.input__match") ? (
            input.value = e.target.innerText,
            new_game_list.style.visibility = "hidden",
            pending__list.appendChild(createCard(input.value)),
            addGame(),
            save(),
            form.reset()
        ) : null;

        e.target && !(e.target.matches("form") || e.target.matches("input#new-game-name") || e.target.matches("input#new-game-submit") || e.target.matches("div#new-game-list")) ? new_game_list.style.visibility = "hidden" : (
            new_game_list.style.visibility = "visible",
            searchGame(input.value)
        );
    });

    document.getElementById("pending").addEventListener("click", (e) => {
        if (e.target && e.target.matches("i.card__status")) {
            if (!e.target.parentElement.classList.contains("completed")) {
                e.target.parentElement.classList.add("completed");
                let i = card__array.findIndex(c => c.cardName == e.target.parentElement.querySelector(".text").value);
                let card = card__array[i];
                let completionDate = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
                !card.hasOwnProperty("date") ? card.date = completionDate : completionDate = card.date;
                e.target.parentElement.querySelector(".card__para").innerText += " | Completado el " + completionDate;
                completed__list.appendChild(e.target.parentElement);
                addGame();
                save();
            }
        }
    });

    document.getElementById("completed").addEventListener("click", (e) => {
        e.target && e.target.matches("i.card__status") ? (
            e.target.parentElement.classList.contains("completed") ? (
                e.target.parentElement.classList.remove("completed"),
                e.target.parentElement.querySelector(".card__para").innerText = e.target.parentElement.querySelector(".card__para").innerText.split("|")[0],
                pending__list.appendChild(e.target.parentElement),
                addGame(),
                save()
            ) : null
        ) : null;
    });
});