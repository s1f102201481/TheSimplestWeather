let inputAddress = '東京都北区';
let locationData = {};
let yesterdayData = {};
let todayData = {};
let tomorrowData = {};
let weatherDataList = [yesterdayData, todayData, tomorrowData];

function getWeather(inputAddress) {
    let encodeAddress = encodeURI(inputAddress);
    let geocodeURL = `https://geocode.csis.u-tokyo.ac.jp/cgi-bin/simple_geocode.cgi?addr=${encodeAddress}`;

    // 住所から緯度と経度を取得するAPIを呼び出す
    return fetch(geocodeURL)
        .then(response => {
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(xmlData => {
            // 取得したXMLデータを解析する
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

            // 緯度と経度を取得
            const longitudeElement = xmlDoc.querySelector('longitude');
            const latitudeElement = xmlDoc.querySelector('latitude');
            locationData['longitude'] = longitudeElement.textContent;
            locationData['latitude'] = latitudeElement.textContent;

            // 住所を取得
            const addressElement = xmlDoc.querySelector('address');
            locationData['address'] = addressElement.textContent;

            // Open Meteo APIを呼び出して天気情報を取得
            let weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${locationData['latitude']}&longitude=${locationData['longitude']}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&past_days=1&forecast_days=3`;

            return fetch(weatherURL);
        })
        .then(response => {
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(weatherData => {
            for (let i = 0; i < 3; i++) {
                weatherDataList[i]['time'] = weatherData.daily.time[i]
                weatherDataList[i]['weather_code'] = weatherData.daily.weather_code[i];
                weatherDataList[i]['temperature_2m_max'] = weatherData.daily.temperature_2m_max[i];
                weatherDataList[i]['temperature_2m_min'] = weatherData.daily.temperature_2m_min[i];
                //weatherDataList['city'] = ;
            }
            // ナビゲーションを閉じる
            const myOffCanvas = document.getElementById('offcanvasNavbar');
            let openedCanvas = bootstrap.Offcanvas.getInstance(myOffCanvas);
            openedCanvas.hide();
            
            today();
            document.getElementById('error').innerHTML = '';
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.getElementsByClassName('address')[0].textContent = 'エラー：天気を取得できません';
        document.getElementById('error').innerHTML = '以下を確認してください<ul><li>日本国内の住所のみ入力可能です。都道府県から入力してください。</li><li>それでも解決しない場合、サーバー側に問題がある可能性があります。時間を置いて、再度お試しください。</li></ul>';
    });
}

function getWeatherDescription(weatherCode) {
    // 条件に基づいてweather_codeとDescriptionを関連付けるオブジェクト
    const weatherMapping = {
        0: "快晴",
        1: "晴れ",
        2: "晴れ時々曇り",
        3: "曇り",
        45: "霧",
        48: "霧氷",
        51: "弱い霧雨",
        53: "霧雨",
        55: "強い霧雨",
        56: "弱い着氷性の霧雨",
        57: "強い着氷性の霧雨",
        61: "小雨",
        63: "雨",
        65: "強い雨",
        66: "弱い雨氷",
        67: "強い雨氷",
        71: "小雪",
        73: "雪",
        75: "強い雪",
        77: "霧雪",
        80: "弱いにわか雨",
        81: "にわか雨",
        82: "激しいにわか雨",
        85: "弱いにわか雪",
        86: "強いにわか雪",
        95: "雷雨",
        96: "弱い雹を伴う雷雨",
        99: "強い雹を伴う雷雨"
    };

    // 指定されたweather_codeが傘が必要な条件に該当するかどうかを判定
    const umbrellaConditions = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    const snowConditions = [71, 73, 75, 77, 85, 86];
    let isUmbrellaRequired = 0;
    if (umbrellaConditions.includes(weatherCode)) {
        isUmbrellaRequired = 0;
    }
    else if (snowConditions.includes(weatherCode)) {
        isUmbrellaRequired = 2;
    }
    else {
        isUmbrellaRequired = 1;
    }

    // 結果を返す
    return {
        description: weatherMapping[weatherCode] || "Unknown",
        isUmbrellaRequired: isUmbrellaRequired
    };
}

let day = 1 //yesterday = 0; today = 1; tommorow = 2;
let colorIcon = true;
let colorFont = true;
function detail() {
    document.getElementById('latitude').textContent = locationData['latitude'];
    document.getElementById('longitude').textContent = locationData['longitude'];

    document.getElementById('maxTempRound').style.color = colorFont ? "orangered" : "#5B5B5B";
    document.getElementById('minTempRound').style.color = colorFont ? "#0d6efd" : "#5B5B5B";

    for (let i = 0; i < 2; i++) {
        document.getElementsByClassName('address')[i].textContent = locationData['address'];
    }

    let weatherData = weatherDataList[day];
    let weatherDescription = getWeatherDescription(weatherData['weather_code']);
    if (weatherDescription.isUmbrellaRequired === 0) {
        document.getElementById('image').innerHTML = 
        colorIcon ? '<img src="img/rain_color.png" alt="雨の画像" class="img-fluid mx-auto d-block" style="max-width: 100%; max-height: 200px; height: auto;">' : '<img src="img/rain.png" alt="雨の画像" class="img-fluid mx-auto d-block" style="max-width: 100%; max-height: 200px; height: auto;">';
        document.getElementById('need').innerHTML = '<strong>傘が必要です</strong>';
    }
    else if (weatherDescription.isUmbrellaRequired === 1) {
        document.getElementById('image').innerHTML = '<img src="img/no_rain.png" alt="傘の画像" class="img-fluid mx-auto d-block" style="max-width: 100%; max-height: 200px; height: auto;">';
        document.getElementById('need').innerHTML = '傘は不要です';
    }
    else {
        document.getElementById('image').innerHTML = 
        colorIcon ? '<img src="img/snow_color.png" alt="雪の画像" class="img-fluid mx-auto d-block" style="max-width: 100%; max-height: 200px; height: auto;">' : '<img src="img/snow.png" alt="雪の画像" class="img-fluid mx-auto d-block" style="max-width: 100%; max-height: 200px; height: auto;">';
        document.getElementById('need').innerHTML = '<strong>雪です</strong>';
    }
    document.getElementById('description').textContent = weatherDescription.description;
    document.getElementById('time').textContent = weatherData['time'];
}

function roundAndFormattTemp(temp) {
    let roundedTemp = Math.round(temp);
    return roundedTemp+'<small>℃</small>';
}

function today() {
    day = 1
    let maxTempDiff = Math.round((todayData['temperature_2m_max'] - yesterdayData['temperature_2m_max'])*10)/10;
    if (maxTempDiff >= 0) {
        maxTempDiff = '+' + maxTempDiff;
    }
    let minTempDiff = Math.round((todayData['temperature_2m_min'] - yesterdayData['temperature_2m_min'])*10)/10;
    if (minTempDiff >= 0) {
        minTempDiff = '+' + minTempDiff;
    }
    let maxTempRound = roundAndFormattTemp(todayData['temperature_2m_max']);
    let minTempRound = roundAndFormattTemp(todayData['temperature_2m_min']);
    document.getElementById('maxTempRound').innerHTML = maxTempRound;
    document.getElementById('minTempRound').innerHTML = minTempRound;
    
    document.getElementById('maxTemp').textContent = todayData['temperature_2m_max'];
    document.getElementById('minTemp').textContent = todayData['temperature_2m_min'];
    
    document.getElementById('maxTempDiff').textContent = maxTempDiff;
    document.getElementById('minTempDiff').textContent = minTempDiff;    

    document.getElementById('tomorrow').classList.add("border-bottom");
    document.getElementById('today').classList.remove("border-bottom");
    detail();
}

function tomorrow() {
    day = 2
    let maxTempDiff = Math.round((tomorrowData['temperature_2m_max'] - todayData['temperature_2m_max'])*10)/10;
    if (maxTempDiff >= 0) {
        maxTempDiff = '+' + maxTempDiff;
    }
    let minTempDiff = Math.round((tomorrowData['temperature_2m_min'] - todayData['temperature_2m_min'])*10)/10;
    if (minTempDiff >= 0) {
        minTempDiff = '+' + minTempDiff;
    }
    let maxTempRound = roundAndFormattTemp(tomorrowData['temperature_2m_max']);
    let minTempRound = roundAndFormattTemp(tomorrowData['temperature_2m_min']);
    document.getElementById('maxTempRound').innerHTML = maxTempRound;
    document.getElementById('minTempRound').innerHTML = minTempRound;
    
    document.getElementById('maxTemp').textContent = tomorrowData['temperature_2m_max'];
    document.getElementById('minTemp').textContent = tomorrowData['temperature_2m_min'];
    
    document.getElementById('maxTempDiff').textContent = maxTempDiff;
    document.getElementById('minTempDiff').textContent = minTempDiff;    

    document.getElementById('today').classList.add("border-bottom");
    document.getElementById('tomorrow').classList.remove("border-bottom");
    detail();
}

// ページが読み込まれたときに初期の住所で実行
document.addEventListener('DOMContentLoaded', getWeather(inputAddress));

// 別の住所で実行する
document.getElementById('searchForm').addEventListener('submit', function(event) {
    // デフォルトのフォーム送信を防ぐ
    event.preventDefault();

    // 入力された値を取得して変数に代入
    inputAddress = document.getElementById('searchInput').value;

    getWeather(inputAddress);
});

let checkbox = document.getElementById('flexSwitchCheckReverse');
checkbox.addEventListener('change', function() {
    // チェックボックスがチェックされているかどうかを確認
    if (checkbox.checked) {
        // チェックされている場合の処理
        document.getElementById('detail').classList.remove("d-none")
    } else {
        // チェックされていない場合の処理
        document.getElementById('detail').classList.add("d-none")
    }
});;

let checkbox2 = document.getElementById('flexSwitchCheckReverse2');
checkbox2.addEventListener('change', function() {
    colorIcon = !colorIcon;
    detail();
});;

let checkbox3 = document.getElementById('flexSwitchCheckReverse3');
checkbox3.addEventListener('change', function() {
    colorFont = !colorFont;
    detail();
});;