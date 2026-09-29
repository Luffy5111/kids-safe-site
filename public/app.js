let currentChild = null;
let player = null;
let timerInterval = null;
let activeVideoId = null;

window.onload = function() {
    fetch('/api/children')
        .then(res => res.json())
        .then(children => {
            const list = document.getElementById('children-list');
            if (!children || children.length === 0) {
                list.innerHTML = '<p>لا يوجد أطفال مضافين، يرجى إضافة بيانات في MySQL.</p>';
                return;
            }
            list.innerHTML = children.map(c => `
                <div class="video-card" onclick="selectChild(${c.id}, '${c.name}', ${c.screen_time_limit})">
                    <h3>👦 ${c.name}</h3>
                    <p>الحد اليومي: ${c.screen_time_limit} دقيقة</p>
                </div>
            `).join('');
        });
};

function selectChild(id, name, limitMinutes) {
    currentChild = { id, name, limitMinutes };
    document.getElementById('step-select-child').style.display = 'none';
    document.getElementById('step-library').style.display = 'block';
    document.getElementById('welcome-msg').innerText = `مرحباً يا ${name}! 👋`;
    
    checkScreenTime();
    loadVideos();
    
    timerInterval = setInterval(checkScreenTime, 5000);
}

function checkScreenTime() {
    if (!currentChild) return;
    
    fetch(`/api/screen-time/${currentChild.id}`)
        .then(res => res.json())
        .then(data => {
            const limitSeconds = data.screen_time_limit * 60;
            const usedSeconds = data.used_seconds;
            const remainingSeconds = limitSeconds - usedSeconds;

            if (remainingSeconds <= 0) {
                document.getElementById('lock-screen').style.display = 'flex';
                if (timerInterval) clearInterval(timerInterval);
            } else {
                const remainingMinutes = Math.ceil(remainingSeconds / 60);
                document.getElementById('timer-display').innerText = `الوقت المتبقي لك اليوم: ${remainingMinutes} دقيقة ⏳`;
            }
        });
}

function loadVideos() {
    fetch('/api/content')
        .then(res => res.json())
        .then(videos => {
            const list = document.getElementById('videos-list');
            if (!videos || videos.length === 0) {
                list.innerHTML = '<p>لا توجد فيديوهات مسجلة في قاعدة البيانات.</p>';
                return;
            }
            list.innerHTML = videos.map(v => `
                <div class="video-card" onclick="playVideo(${v.id}, '${v.youtube_video_id}', '${v.title}')">
                    <h4>🎬 ${v.title}</h4>
                    <p>مناسب لعمر: ${v.min_age}-${v.max_age} سنة</p>
                </div>
            `).join('');
        });
}

function playVideo(dbVideoId, youtubeId, title) {
    activeVideoId = dbVideoId;
    document.getElementById('step-library').style.display = 'none';
    document.getElementById('step-player').style.display = 'block';
    document.getElementById('playing-title').innerText = title;
    document.getElementById('back-btn').style.display = 'none';

    document.getElementById('player-container').innerHTML = `<div id="yt-player"></div>`;

    player = new YT.Player('yt-player', {
        height: '360',
        width: '640',
        videoId: youtubeId,
        playerVars: { 'rel': 0, 'modestbranding': 1 },
        events: { 'onStateChange': onPlayerStateChange }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        document.getElementById('back-btn').style.display = 'inline-block';
        saveWatchHistory();
    }
}

function saveWatchHistory() {
    if (!currentChild || !activeVideoId) return;
    fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            child_id: currentChild.id,
            content_id: activeVideoId,
            duration_seconds: 120
        })
    }).then(() => checkScreenTime());
}

function backToLibrary() {
    if (player) player.destroy();
    document.getElementById('step-player').style.display = 'none';
    document.getElementById('step-library').style.display = 'block';
}