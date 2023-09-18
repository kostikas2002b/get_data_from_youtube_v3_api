
// AmiYiami
// Uploads Playlist ID = UUINQg0BNDHQvndHRw6bsxnA

// Eponimos
// Uploads Playlist ID = UUFOasUEk9Pkr8YeJxGc88Lw

// VenetiaKamara
// Uploads Playlist ID = UUycE6YyscBc6mx-KxvSVKWg

let playlistItems = [];

let videoIds = [];
let videos = [];
let videosLength = 0;
let videoInfo1 = [];
let videoInfo2 = [];
let videoInfoAll = [];

const form = document.querySelector('form');

form.addEventListener('submit', async function (event) {
    
    event.preventDefault();

    const apiKey = this.querySelector('#api-key-input').value;
    const playlistId = this.querySelector('#playlist-id-input').value;

    if ( (!apiKey) || (!playlistId) ) {
        return;
    }

    this.querySelector('#api-key-input').disabled = true;
    this.querySelector('#playlist-id-input').disabled = true;

    this.querySelector('button').style.display = 'none';

    playlistItems = await getPlaylistItems(apiKey, playlistId);
    console.log(playlistItems);

    renderJSONTree(playlistItems);
    
    videoIds = playlistItems.map(function (arrayItem) {
        return arrayItem['snippet']['resourceId']['videoId'];
    });

    videosLength = videoIds.length;
    
    videos = await getVideos(apiKey, videoIds);
    console.log(videos);

    videoInfo1 = playlistItems.map(function (arrayItem) {
        return {
            id: arrayItem['snippet']['resourceId']['videoId'],
            title: arrayItem['snippet']['title'],
            url: ( 'https://www.youtube.com/watch?v=' + arrayItem['snippet']['resourceId']['videoId'] ),
            publishedAt: arrayItem['snippet']['publishedAt'].replace('T', '<br>')
        }
    });

    videoInfo2 = videos.map(function (arrayItem) {
        return {
            comments: arrayItem['statistics']['commentCount'],
            favorites: arrayItem['statistics']['favoriteCount'],
            likes: arrayItem['statistics']['likeCount'],
            views: arrayItem['statistics']['viewCount'],
            duration: arrayItem['contentDetails']['duration']
        }
    });

    for (let i = 0 ; i < videosLength ; i++) {
        let duration = videoInfo2[i]['duration'];
        videoInfo2[i]['duration']  = convertDurationStringToCorrectFormat(duration);
    }

    for (let i = 0 ; i < videosLength ; i++) {
        videoInfoAll.push(Object.assign({}, videoInfo1, videoInfo2));
    }

    let finalTableDiv = document.createElement('div');
    finalTableDiv.setAttribute('id','final-table-div');
    finalTableDiv.innerHTML = `
        <table>
            <tbody>
                <tr>
                    <th></th>
                    <th>ID<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Title<br><a href="javascript:void(0)">copy column</a></th>
                    <th>URL<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Published Date<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Duration<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Comments<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Favorites<br><a href="javascript:void(0)">copy column</a></th>
                    <th>Likes<br><a href="javascript:void(0)">copy column</a></th>
                    <th>views<br><a href="javascript:void(0)">copy column</a></th>
                </tr>
            </tbody>
        </table>
    `;
    document.getElementById('content').appendChild(finalTableDiv);
    
    const finalTableTBody = document.querySelector('#final-table-div > table > tbody');
    let aTableRow;
    for (let i = 0 ; i < videosLength ; i++) {
        aTableRow = document.createElement('tr');
        aTableRow.innerHTML = `
            <td>${i+1}</td>
            <td>${videoInfo1[i]['id']}</td>
            <td>${videoInfo1[i]['title']}</td>
            <td>${videoInfo1[i]['url']}</td>
            <td>${videoInfo1[i]['publishedAt']}</td>
            <td>${videoInfo2[i]['duration']}</td>
            <td>${videoInfo2[i]['comments']}</td>
            <td>${videoInfo2[i]['favorites']}</td>
            <td>${videoInfo2[i]['likes']}</td>
            <td>${videoInfo2[i]['views']}</td>
        `    
        finalTableTBody.appendChild(aTableRow);
    }
    
    const finalTable = document.querySelector('#final-table-div > table');
    finalTable.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            const columnIndex = event.target.closest('th').cellIndex;
            const columnData = [];
            
            // Iterate through each row and collect data from the clicked column
            for (const row of finalTable.tBodies[0].rows) {
                columnData.push(row.cells[columnIndex].textContent);
            }
            
            // Create a string representation of the column data
            const columnText = columnData.join('\n');
            
            // Create a textarea to hold the column data
            const textarea = document.createElement('textarea');
            textarea.value = columnText;
            document.body.appendChild(textarea);
            
            // Select and copy the data to the clipboard
            textarea.select();
            document.execCommand('copy');
            
            // Clean up the textarea
            document.body.removeChild(textarea);
            
            // Optionally, provide feedback to the user
            alert('Column copied to clipboard.');
        }
    });

});

////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////

async function getPlaylistItems(apiKey, playlistId) {

    let playlistItems = [];
    
    let pageToken = false;
    
    let responseData;
    while (true) {

        responseData = await getPlaylistItemsDataPerPage(apiKey, playlistId, pageToken);

        playlistItems = playlistItems.concat(responseData['items']);
        pageToken = responseData['nextPageToken'];
        
        if (!pageToken) {
            break;
        }

    }

    return playlistItems;
}

async function getPlaylistItemsDataPerPage(apiKey, playlistId, pageToken) {
    
    let queryUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    
    if (pageToken) {
        queryUrl += `&pageToken=${pageToken}`;
    }

    const queryResult = fetch(queryUrl).then(result => {
        // console.log('a1');
        // alert('continue a1?');
        return result.json(); 
    }).then(result => {
        // console.log('a2');
        // console.log(result);
        // alert('continue a2?');
        return result;
    });

    return queryResult;

}

async function getVideos(apiKey, videoIds) {
    let queryUrl;
    let queryResult;
    let videos = [];
    let videosBatch = [];
    let videosLeft = [];
    while (true) {
        videosBatch = videoIds.slice(0, 50);

        queryUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics%2CcontentDetails%2Csnippet&id=${videosBatch.join('%2C')}&key=${apiKey}`;
        
        queryResult = await fetch(queryUrl).then(result => {
            // console.log('b1');
            // alert('continue b1?');
            return result.json(); 
        }).then(result => {
            // console.log('b2');
            // console.log(result);
            // alert('continue b2?');
            return result;
        });
        
        videos = videos.concat(queryResult['items']);
        videosLeft = videoIds.slice(50);
        videoIds = videosLeft;
        if (videosLeft.length === 0) {
            break;
        }
    }
    return videos;

}

function convertDurationStringToCorrectFormat (duration) {
    
    let indexOfS, indexOfM, indexOfH;

    // add 'S' if it's not present
    if (duration.indexOf('S') === -1) {
        duration = duration + '00S';
    }

    // if both chars before 'S' are not numbers (so 'S' value is one digit), left-pad the already existing one-digit number
    indexOfS = duration.indexOf('S');
    if ( (duration[indexOfS-2]) > '9' ) { // must be 9 character
        duration = duration.slice(0, indexOfS-1) + '0' + duration.slice(indexOfS-1);
    }

    // add 'M' if it's not present
    if (duration.indexOf('M') === -1) {
        indexOfS = duration.indexOf('S');
        duration = duration.slice(0, indexOfS-2) + '00M' + duration.slice(indexOfS-2);
    }

    // if both chars before 'M' are not numbers (so 'M' value is one digit), left-pad the already existing one-digit number
    indexOfM = duration.indexOf('M');
    if ( (duration[indexOfM-2]) > '9' ) { // must be 9 character
        duration = duration.slice(0, indexOfM-1) + '0' + duration.slice(indexOfM-1);
    }

    // add 'H' if it's not present
    if (duration.indexOf('H') === -1) {
        indexOfM = duration.indexOf('M');
        duration = duration.slice(0, indexOfM-2) + '00H' + duration.slice(indexOfM-2);
    }

    // if both chars before 'H' are not numbers (so 'H' value is one digit), left-pad the already existing one-digit number
    indexOfH = duration.indexOf('H');
    if ( (duration[indexOfH-2]) > '9' ) { // must be 9 character
        duration = duration.slice(0, indexOfH-1) + '0' + duration.slice(indexOfH-1);
    }
    
    // remove all chars before the hour part
    indexOfH = duration.indexOf('H');
    duration = duration.slice(indexOfH-2);

    // construct final duration string, removing leading zeros from hours/minutes parts
    let secondsPart, minutesPart, hoursPart;
    indexOfS = duration.indexOf('S');
    indexOfM = duration.indexOf('M');
    indexOfH = duration.indexOf('H');
    secondsPart = duration.slice(indexOfS-2, indexOfS);
    minutesPart = duration.slice(indexOfM-2, indexOfM);
    hoursPart = duration.slice(indexOfH-2, indexOfH);
    if (hoursPart === '00') {
        duration = '' + parseInt(minutesPart) + ':' + secondsPart;
    } else {
        duration = '' + parseInt(hoursPart) + ':' + minutesPart + ':' + secondsPart;
    }

    return duration;

}

////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////

function renderJSONTree(jsonData) {

    // IMPLEMENTATION 1: from https://github.com/summerstyle/jsonTreeViewer
    {
        // (not used)
    }

    // IMPLEMENTATION 2: from https://github.com/pgrabovets/json-view
    {

        // create dom element-container
        const treeContainer = document.createElement('div');
        // give it an id-handle
        treeContainer.setAttribute('id','tree-container');
        // create json tree object
        const treeObj = jsonview.create(jsonData);
        // render tree into dom container
        jsonview.render(treeObj, treeContainer);
        // append container to dom
        document.getElementById('content').appendChild(treeContainer);

        // switch between monospace font and Open Sans
        {

            const treeFontSwitch = document.createElement('div');

            treeFontSwitch.innerHTML = '<input type="radio" name="tree-font-switch" id="open-sans" checked><label for="open-sans">Open Sans</label><input type="radio" name="tree-font-switch" id="monospace"><label for="monospace">monospace</label>';
            
            treeFontSwitch.addEventListener('change', function (event) {
                if (document.querySelector('#tree-container #open-sans').checked) {
                    document.querySelector('#tree-container .json-container').style.fontFamily = '"Open Sans"';
                } else {
                    document.querySelector('#tree-container .json-container').style.fontFamily = 'monospace';
                }
            });

            document.getElementById('tree-container').prepend(treeFontSwitch);

        }

    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////
