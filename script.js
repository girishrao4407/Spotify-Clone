let currentSong = new Audio();
let currentPlaylist = [];
let currentIndex = 0;

// Manually list your folders
async function getPlaylists() {
  return ["hindi", "musicOnly","english"]; // Add more playlist folder names here
}

async function getSongs(folder = "songs/hindi") {
  console.log("📁 Getting songs from folder:", folder);

  let a = await fetch(folder);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;

  let links = div.querySelectorAll("a");
  let songs = [];
  for (let link of links) {
    const href = link.getAttribute("href");
    if (href.endsWith(".mp3")) {
      const filename = decodeURIComponent(href.split("/").pop());
      songs.push(filename);
    }
  }

  console.log("🎵 Songs found:", songs);
  return { songs, folder };
}

function resetAllSongIcons() {
  document.querySelectorAll(".songlist li img:last-child").forEach(img => {
    img.src = "/assets/play.svg";
  });
}

const playMusic = (trackPath, pause = false, index = null) => {
  console.log("▶️ Playing:", trackPath);
  currentSong.src = trackPath;

  if (!pause) {
    currentSong.play();
    play.src = "/assets/pause.svg";
  } else {
    play.src = "/assets/play.svg";
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(trackPath.split("/").pop());
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  resetAllSongIcons();

  if (index !== null) {
    let li = document.querySelectorAll(".songlist li")[index];
    if (li) {
      let icon = li.querySelector("img:last-child");
      if (icon) icon.src = pause ? "/assets/play.svg" : "/assets/pause.svg";
    }
  }
};

async function loadPlaylist(folderName = "hindi") {
  console.log("📂 Loading playlist:", folderName);

  let { songs, folder } = await getSongs(`songs/${folderName}`);
  currentPlaylist = songs;
  currentIndex = 0;

  let songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    songUL.innerHTML += `<li>
      <img class="invert" src="/assets/music.svg" alt="">
      <div class="info">
        <div>${song}</div>
        <div>song artist</div>
      </div>
      <img class="invert" src="/assets/play.svg" alt="">
    </li>`;
  }

  Array.from(songUL.getElementsByTagName("li")).forEach((li, index) => {
    li.addEventListener("click", () => {
      const songName = li.querySelector(".info div").innerText.trim();
      currentIndex = index;
      playMusic(`${folder}/${songName}`, false, index);
    });
  });

  if (songs.length > 0) {
    playMusic(`${folder}/${songs[0]}`, true, 0);
  }
}

function createPlaylistCard(name) {
  let card = document.createElement("div");
  card.classList.add("card", "rounded");
  card.setAttribute("data-playlist", name);

  const imgPath = `songs/${name}/cover.jpg`;

  card.innerHTML = `
    <div class="play">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 20.1957V3.80421C6 3.01878 6.86395 2.53993 7.53 2.95621L20.6432 11.152C21.2699 11.5436 21.2699 12.4563 20.6432 12.848L7.53 21.0437C6.86395 21.46 6 20.9812 6 20.1957Z"></path>
      </svg>
    </div>
    <img src="${imgPath}" alt="cover" onerror="this.src='/assets/portfolio-img.jpg'" />
    <h2>${name}</h2>
    <p>Click to load playlist</p>
  `;
  return card;
}

async function main() {
  const playlists = await getPlaylists();
  const container = document.querySelector(".cardContainer");

  playlists.forEach(async (playlistName, index) => {
    if (!playlistName) return;

    const card = createPlaylistCard(playlistName);
    container.appendChild(card);

    if (index === 0) {
      await loadPlaylist(playlistName);
    }

    card.addEventListener("click", () => {
      loadPlaylist(playlistName);
    });
  });

  // Play/Pause toggle
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "/assets/pause.svg";
      let li = document.querySelectorAll(".songlist li")[currentIndex];
      if (li) li.querySelector("img:last-child").src = "/assets/pause.svg";
    } else {
      currentSong.pause();
      play.src = "/assets/play.svg";
      let li = document.querySelectorAll(".songlist li")[currentIndex];
      if (li) li.querySelector("img:last-child").src = "/assets/play.svg";
    }
  });

  // Time update + seek bar
  currentSong.addEventListener("timeupdate", () => {
    let currentTime = Math.floor(currentSong.currentTime);
    let duration = Math.floor(currentSong.duration);
    let currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = currentTime % 60;
    let durationMinutes = Math.floor(duration / 60);
    let durationSeconds = duration % 60;

    if (currentSeconds < 10) currentSeconds = "0" + currentSeconds;
    if (durationSeconds < 10) durationSeconds = "0" + durationSeconds;

    document.querySelector(".songtime").innerHTML = `${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`;
    document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let seekBar = document.querySelector(".seekbar");
    let seekBarWidth = seekBar.offsetWidth;
    let clickX = e.clientX - seekBar.getBoundingClientRect().left;
    let percentage = clickX / seekBarWidth;
    currentSong.currentTime = percentage * currentSong.duration;
    document.querySelector(".circle").style.left = `${percentage * 100}%`;
  });

  // Next/Previous buttons
  document.getElementById("next").addEventListener("click", () => {
    if (currentPlaylist.length === 0) return;
    currentIndex = (currentIndex + 1) % currentPlaylist.length;
    const folder = currentSong.src.split("/songs/")[1].split("/")[0];
    playMusic(`songs/${folder}/${currentPlaylist[currentIndex]}`, false, currentIndex);
  });

  document.getElementById("previous").addEventListener("click", () => {
    if (currentPlaylist.length === 0) return;
    currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    const folder = currentSong.src.split("/songs/")[1].split("/")[0];
    playMusic(`songs/${folder}/${currentPlaylist[currentIndex]}`, false, currentIndex);
  });

  // Hamburger menu
  const hamberger = document.querySelector(".hamberger");
  const leftMenu = document.querySelector(".left");
  let isOpen = false;

  hamberger.addEventListener("click", () => {
    leftMenu.style.left = isOpen ? "-100%" : "0";
    isOpen = !isOpen;
  });
}

main();
