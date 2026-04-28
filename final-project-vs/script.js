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
    // Always try to get from database first
    try {
        const response = await fetch('/api/songs');
        if (!response.ok) {
            throw new Error(`Database fetch failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Loaded data from database:', data.length, 'songs');
        return data;
    } catch (error) {
        console.error('❌ Database fetch failed:', error);

        // Only fall back to localStorage if database is completely unavailable
        console.log('⚠️ Falling back to localStorage...');
        const savedData = localStorage.getItem("importedData");
        if (!savedData) {
            console.log('No localStorage data found either');
            return [];
        }

        try {
            const data = JSON.parse(savedData);
            console.log('Loaded data from localStorage:', data.length, 'songs');
            return data;
        } catch (parseError) {
            console.error('Failed to parse localStorage data:', parseError);
            return [];
        }
    }
}

async function saveImportedData(data) {
    // Always try to save to database first
    try {
        const response = await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songs: data })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Database save failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('✅ Successfully saved to database:', result);
        return result;
    } catch (error) {
        console.error('❌ Database save failed:', error);

        // Show user-friendly error message
        alert(`Failed to save to database: ${error.message}\n\nPlease make sure the server is running and try again.`);

        // Re-throw error so calling function knows it failed
        throw error;
    }
}

async function addImportedSongs(newSongs) {
    return await saveImportedData(newSongs);
}

async function clearImportedData() {
    // Always try to clear from database first
    try {
        const response = await fetch('/api/songs', { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Database clear failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('✅ Successfully cleared database:', result);

        // Also clear localStorage as backup
        localStorage.removeItem("importedData");
        return result;
    } catch (error) {
        console.error('❌ Database clear failed:', error);

        // Only clear localStorage if database clear failed
        console.log('⚠️ Clearing localStorage instead...');
        localStorage.removeItem("importedData");
        return { message: 'Cleared localStorage (database clear failed)' };
    }
}

async function getStats() {
    // Always try to get stats from database first
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error(`Database stats failed: ${response.status} ${response.statusText}`);
        }
        const stats = await response.json();
        console.log('✅ Loaded stats from database:', stats);
        return stats;
    } catch (error) {
        console.error('❌ Database stats failed:', error);

        // Fall back to calculating from localStorage data
        console.log('⚠️ Calculating stats from localStorage...');
        try {
            const data = await getImportedData();
            const stats = {
                totalSongs: data.length,
                totalListens: data.reduce((sum, song) => sum + Number(song.listens), 0),
                avgListens: data.length > 0 ? Math.round(data.reduce((sum, song) => sum + Number(song.listens), 0) / data.length) : 0
            };
            console.log('Calculated stats from localStorage:', stats);
            return stats;
        } catch (calcError) {
            console.error('Failed to calculate stats:', calcError);
            return { totalSongs: 0, totalListens: 0, avgListens: 0 };
        }
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
            <td class="song-title">${song.title}${song.description ? `<br><small style="color: #666;">${song.description}</small>` : ''}</td>
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
    const description = document.getElementById("songDescription").value.trim();

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
        listens: parseInt(listens),
        description: description || ""  // Optional, default to empty string
    };

    tempSongs.push(song);
    displaySongsList();

    document.getElementById("songTitle").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("listensCount").value = "";
    document.getElementById("songDescription").value = "";
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
                ${song.description ? `<div>Description: ${song.description}</div>` : ''}
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

    // Show loading message
    const importBtn = document.querySelector('.import-btn');
    const originalText = importBtn.textContent;
    importBtn.textContent = 'Importing...';
    importBtn.disabled = true;

    try {
        console.log('🚀 Starting import of', songsCount, 'songs to database...');

        const result = await addImportedSongs(tempSongs);

        // Success!
        tempSongs = [];
        displaySongsList();

        console.log('✅ Import successful:', result);
        alert(`✅ Successfully imported ${songsCount} songs to database!\n\nYou can now view them on the info page.`);

        // Redirect to info page to show the imported songs
        window.location.href = "info.html";

    } catch (error) {
        console.error('❌ Import failed:', error);
        alert(`❌ Failed to import songs to database:\n\n${error.message}\n\nPlease make sure the server is running and try again.`);

    } finally {
        // Reset button
        importBtn.textContent = originalText;
        importBtn.disabled = false;
    }
}

function clearAllFields() {
    if (confirm("Are you sure you want to clear all songs and input fields?")) {
        document.getElementById("songTitle").value = "";
        document.getElementById("artistName").value = "";
        document.getElementById("listensCount").value = "";
        document.getElementById("songDescription").value = "";
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
            <table class="info-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Song Title</th>
                        <th>Artist</th>
                        <th>Description</th>
                        <th>Listens</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((song, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${song.title}</td>
                    <td>${song.artist}</td>
                    <td>${song.description || 'N/A'}</td>
                    <td>${Number(song.listens).toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        dataInfoDiv.innerHTML = html;
    } catch (error) {
        dataInfoDiv.innerHTML = "<p style='color: red;'>Error loading data. Please try again.</p>";
    }
}

async function clearData() {
    if (confirm("⚠️ Are you sure you want to clear ALL imported songs from the database?\n\nThis action cannot be undone!")) {
        try {
            console.log('🗑️ Clearing all data from database...');
            const result = await clearImportedData();
            await displayDataInfo();
            console.log('✅ Database cleared:', result);
            alert("✅ All songs have been cleared from the database!");
        } catch (error) {
            console.error('❌ Failed to clear database:', error);
            alert(`❌ Failed to clear data from database:\n\n${error.message}\n\nPlease make sure the server is running.`);
        }
    }
}

if (document.getElementById("dataInfo")) {
    displayDataInfo();
}
