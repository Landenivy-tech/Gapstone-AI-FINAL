const songs = [
    { title: "Stairway to Heaven", artist: "Led Zeppelin", listens: 4200000 },
    { title: "Bohemian Rhapsody", artist: "Queen", listens: 3800000 },
    { title: "Hotel California", artist: "Eagles", listens: 3500000 },
    { title: "Sweet Child o' Mine", artist: "Guns N' Roses", listens: 3100000 },
    { title: "Smells Like Teen Spirit", artist: "Nirvana", listens: 2900000 },
    { title: "Black", artist: "Pearl Jam", listens: 2700000 },
    { title: "Wonderwall", artist: "Oasis", listens: 2500000 },
    { title: "Paranoid Android", artist: "Radiohead", listens: 2300000 },
    { title: "Comfortably Numb", artist: "Pink Floyd", listens: 2100000 },
    { title: "Another One Bites the Dust", artist: "Queen", listens: 1900000 }
];

let currentData = [...songs];

function formatListens(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
}

function getRankClass(rank) {
    if (rank === 1) return "rank top1";
    if (rank === 2) return "rank top2";
    if (rank === 3) return "rank top3";
    return "rank";
}

function renderTable() {
    const tbody = document.getElementById("leaderboardBody");
    const noResults = document.getElementById("noResults");

    if (currentData.length === 0) {
        tbody.innerHTML = "";
        noResults.style.display = "block";
        return;
    }

    noResults.style.display = "none";
    tbody.innerHTML = currentData.map((song, index) => `
        <tr>
            <td class="${getRankClass(index + 1)}">${index + 1}</td>
            <td class="song-title">${song.title}</td>
            <td class="artist">${song.artist}</td>
            <td class="listens">${formatListens(song.listens)}</td>
        </tr>
    `).join("");
}

document.getElementById("searchInput").addEventListener("keyup", function() {
    const searchTerm = this.value.toLowerCase();
    currentData = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm)
    );
    currentData.sort((a, b) => b.listens - a.listens);
    renderTable();
});

function resetSearch() {
    document.getElementById("searchInput").value = "";
    currentData = [...songs];
    renderTable();
}

function sortTable(field) {
    if (field === "listens") {
        currentData.sort((a, b) => b.listens - a.listens);
    } else if (field === "title") {
        currentData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (field === "artist") {
        currentData.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    renderTable();
}

// Initial render
renderTable();

// Load imported data from localStorage on page load
function loadImportedData() {
    const savedData = localStorage.getItem("importedData");
    if (savedData) {
        try {
            const importedData = JSON.parse(savedData);
            // Replace the default songs with imported data
            songs.length = 0;
            songs.push(...importedData);
            currentData = [...songs];
        } catch (error) {
            console.error("Error loading saved data:", error);
        }
    }
}

// Call this on leaderboard page
if (document.getElementById("leaderboardBody")) {
    loadImportedData();
    renderTable();
}

let tempSongs = [];

function addSong() {
    const title = document.getElementById("songTitle").value.trim();
    const artist = document.getElementById("artistName").value.trim();
    const listens = document.getElementById("listensCount").value.trim();

    if (!title) {
        alert("Please enter a song title");
        return;
    }
    if (!artist) {
        alert("Please enter an artist name");
        return;
    }
    if (!listens || isNaN(listens) || listens <= 0) {
        alert("Please enter a valid number of listens");
        return;
    }

    const song = {
        title: title,
        artist: artist,
        listens: parseInt(listens)
    };

    tempSongs.push(song);
    displaySongsList();

    // Clear the input fields
    document.getElementById("songTitle").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("listensCount").value = "";
    document.getElementById("songTitle").focus();
}

function displaySongsList() {
    const songsList = document.getElementById("songsList");

    if (tempSongs.length === 0) {
        songsList.innerHTML = "";
        return;
    }

    let html = `<h3>Songs to Import (${tempSongs.length}):</h3><div class="temp-songs">`;

    tempSongs.forEach((song, index) => {
        html += `
            <div class="temp-song-item">
                <div><strong>${index + 1}. ${song.title}</strong></div>
                <div>Artist: ${song.artist}</div>
                <div>Listens: ${song.listens.toLocaleString()}</div>
                <button onclick="removeSong(${index})" class="remove-btn">Remove</button>
            </div>
        `;
    });

    html += `</div>`;
    songsList.innerHTML = html;
}

function removeSong(index) {
    tempSongs.splice(index, 1);
    displaySongsList();
}

function importAllSongs() {
    if (tempSongs.length === 0) {
        alert("Please add at least one song before importing");
        return;
    }

    const songsCount = tempSongs.length;

    // Store imported data in localStorage
    localStorage.setItem("importedData", JSON.stringify(tempSongs));

    // Clear temp data
    tempSongs = [];
    displaySongsList();

    alert(`Successfully imported ${songsCount} songs! Redirecting to info page...`);

    // Redirect to info page after a short delay
    setTimeout(() => {
        window.location.href = "info.html";
    }, 1000);
}

function clearAllFields() {
    if (confirm("Are you sure you want to clear all songs and input fields?")) {
        document.getElementById("songTitle").value = "";
        document.getElementById("artistName").value = "";
        document.getElementById("listensCount").value = "";
        tempSongs = [];
        displaySongsList();
    }
}
