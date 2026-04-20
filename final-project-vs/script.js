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
