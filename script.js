const cards_container = document.querySelector(".work-cards-container");

console.log(cards_container);

cards_container.innerHTML = "";
createCard(
  "Titanic-Kaggle",
  "IA Project - My contribution for the Kaggle exercice named Titanic, i already reached 0.79+ accuracy with this code.",
  "https://github.com/ClemNTTS/kaggle-titanic",
  "./assets/img/titanic.jpg"
);
createCard(
  "Craby Rugby",
  "This is my first multiplayer game project. The objectives for this project are to learn server-side programming in Rust and create a simple graphical game with the lowest possible latency.",
  "https://github.com/ClemNTTS/Craby_Rugby",
  "./assets/img/crabs.webp"
);
createCard(
  "Lem-in",
  "Algorithm - This student project involves creating a digital version of an ant farm. The goal is to develop a program called `lem-in` that reads from a file describing ants and their colony, finds the quickest path for the ants, and displays their movements.",
  "https://github.com/ClemNTTS/lem-in",
  "./assets/img/ants.jpg"
);
createCard(
  "Planète Mer",
  "IA Project - This project has been realise in collaboration with SQLI corporation and Planète Mer association. It's a IA chat bot specialised in French and European fishing laws. This project implement Ollama model.",
  "https://github.com/ClemNTTS/IA_Planete_Mer",
  "./assets/img/fisherman.jpg"
);
createCard(
  "Morpion",
  "A little project in C# and .NET where you could play TicTacToe with a friend or against an Algorithm.",
  "https://github.com/ClemNTTS/Morpion",
  "./assets/img/tic-tac-toe.webp"
);
createCard(
  "Forum",
  "This is a group project from my school. Instructions are simple, make a forum where we can create post and use a real time private chat with connected users. This project include SQLite, Go, JS & Websocket technologies.",
  "https://github.com/arocchet/real-time-forum",
  "./assets/img/forum.jpg"
);

function createCard(title, description, url, imgUrl) {
  const card = document.createElement("div");
  card.classList.add("card");

  const header = document.createElement("div");
  header.classList.add("card-header");
  if (imgUrl) {
    header.style.backgroundImage = "url(" + imgUrl + ")";
  }
  const title_element = document.createElement("h3");
  title_element.textContent = title;
  header.appendChild(title_element);
  card.appendChild(header);

  const description_element = document.createElement("p");
  description_element.textContent = description;
  const link_element = document.createElement("a");
  link_element.href = url;
  link_element.textContent = "See Project";
  card.appendChild(description_element);
  link_element.addEventListener("click", (event) => {
    event.preventDefault();
    window.open(url, "_blank");
  });
  card.appendChild(link_element);
  cards_container.appendChild(card);
}
