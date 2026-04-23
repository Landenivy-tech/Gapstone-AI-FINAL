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

async function getImportedData() {
    try {
        const response = await fetch('/api/songs');
        if (!response.ok) throw new Error('Failed to fetch songs');
        return await response.json();
    } catch (error) {
        console.log('API not available, using localStorage');
        const savedData = localStorage.getItem("importedData");
        if (!savedData) return [];
        try {
            return JSON.parse(savedData);
        } catch (e) {
            return [];
        }
    }
}

async function saveImportedData(data) {
    try {
        const response = await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songs: data })
        });
        if (!response.ok) throw new Error('Failed to save songs');
        return await response.json();
    } catch (error) {
        console.log('API not available, using localStorage');
        localStorage.setItem("importedData", JSON.stringify(data));
        return { message: 'Saved to localStorage' };
    }
}

async function addImportedSongs(newSongs) {
    return await saveImportedData(newSongs);
}

async function clearImportedData() {
    try {
        const response = await fetch('/api/songs', { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to clear songs');
        return await response.json();
    } catch (error) {
        console.log('API not available, using localStorage');
        localStorage.removeItem("importedData");
        return { message: 'Cleared localStorage' };
    }
}

async function getStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.log('API not available, calculating from localStorage');
        const data = await getImportedData();
        return {
            totalSongs: data.length,
            totalListens: data.reduce((sum, song) => sum + Number(song.listens), 0),
            avgListens: data.length > 0 ? Math.round(data.reduce((sum, song) => sum + Number(song.listens), 0) / data.length) : 0
        };
    }
}

function renderTable() {
    const tbody = document.getElementById("leaderboardBody");
    const noResults = document.getElementById("noResults");

    if (!tbody) return;

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

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("keyup", function() {
        const searchTerm = this.value.toLowerCase();
        currentData = songs.filter(song =>
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm)
        );
        currentData.sort((a, b) => b.listens - a.listens);
        renderTable();
    });
}

function resetSearch() {
    const searchElement = document.getElementById("searchInput");
    if (!searchElement) return;
    searchElement.value = "";
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

async function loadImportedData() {
    const importedData = await getImportedData();
    if (importedData.length > 0) {
        songs.length = 0;
        songs.push(...importedData);
        currentData = [...songs];
    }
}

if (document.getElementById("leaderboardBody")) {
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

    document.getElementById("songTitle").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("listensCount").value = "";
    document.getElementById("songTitle").focus();
}

function displaySongsList() {
    const songsList = document.getElementById("songsList");
    if (!songsList) return;

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

async function importAllSongs() {
    if (tempSongs.length === 0) {
        alert("Please add at least one song before importing");
        return;
    }

    const songsCount = tempSongs.length;

    try {
        await addImportedSongs(tempSongs);
        tempSongs = [];
        displaySongsList();
        alert(`Successfully imported ${songsCount} songs!`);
        window.location.href = "info.html";
    } catch (error) {
        alert("Error importing songs. Please try again.");
    }
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

async function displayDataInfo() {
    const dataInfoDiv = document.getElementById("dataInfo");
    if (!dataInfoDiv) return;

    try {
        const [data, stats] = await Promise.all([getImportedData(), getStats()]);

        if (data.length === 0) {
            dataInfoDiv.innerHTML = "<p style='text-align: center; color: #999;'>No imported data yet. <a href='import.html'>Go to Import</a></p>";
            return;
        }

        let html = `
            <div class="data-stats">
                <p><strong>Total Songs:</strong> ${stats.totalSongs}</p>
                <p><strong>Total Listens:</strong> ${stats.totalListens.toLocaleString()}</p>
                <p><strong>Average Listens:</strong> ${stats.avgListens.toLocaleString()}</p>
            </div>
            <h3>Imported Songs:</h3>
            <div class="data-list">
        `;

        data.forEach((song, index) => {
            html += `
                <div class="data-item">
                    <div><strong>${index + 1}. ${song.title}</strong></div>
                    <div>Artist: ${song.artist}</div>
                    <div>Listens: ${Number(song.listens).toLocaleString()}</div>
                </div>
            `;
        });

        html += `</div>`;
        dataInfoDiv.innerHTML = html;
    } catch (error) {
        dataInfoDiv.innerHTML = "<p style='color: red;'>Error loading data. Please try again.</p>";
    }
}

async function clearData() {
    if (confirm("Are you sure you want to clear all imported data?")) {
        try {
            await clearImportedData();
            await displayDataInfo();
            alert("Data cleared!");
        } catch (error) {
            alert("Error clearing data. Please try again.");
        }
    }
}

if (document.getElementById("dataInfo")) {
    displayDataInfo();
}
