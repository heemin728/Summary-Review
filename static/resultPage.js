let id = "none";
let resName = "none";

document.addEventListener('DOMContentLoaded', function () {
    getURL();
    startFetching(id);
});

function getURL() {
    const urlParams = new URLSearchParams(window.location.search);
    resName = urlParams.get('name');
    id = urlParams.get('id');
}

function createLoadingBar() {
    const body = document.getElementById('page-top');
    body.style.opacity=0.5;
    // body.style.position='fixed';

    const spinner = document.getElementById('spinner1');
    spinner.style.display = 'flex';
}

function destroyLoadingBar() {
    const body = document.getElementById('page-top');
    body.style.opacity = 1;
    // body.style.position='static';

    const spinner = document.getElementById('spinner1');
    spinner.style.display = 'none';
    console.log('destroy');
}


// '확인하기' 버튼을 눌렀을 때 - 크롤링 시작
function startFetching(id) {

    const server_url = "http://1.230.255.45:8001/result"
    currentId = id;
    const url = "http://place.map.kakao.com/" + id;
    const headerResultContainer = document.getElementById("headResult");
    const averageResultContainer = document.getElementById("average-rating");
    const posSumContainer = document.getElementById("pos-sum");
    const negSumContainer = document.getElementById("neg-sum");

    headerResultContainer.innerHTML = `<h2><strong>${resName}<strong> 의 검색 결과</h2>`
    averageResultContainer.innerHTML = ``;
    posSumContainer.innerHTML = ``;
    negSumContainer.innerHTML = ``;

    createLoadingBar();
    console.log('start fetching');
    fetch(server_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
    })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                console.log("response ok");
                return response.json();
            } else {
                console.log("response not ok");
                throw new Error("서버 오류");
            }
        })
        .then(data => {
            const reviews = data[0];
            const averageStar = data[1];
            const pos_num = data[2];
            const neg_num = data[3];

            console.log("pos_num=", pos_num, ", neg_num=", neg_num);

            averageResultContainer.innerHTML = `
                <h3 class="my-font" >${averageStar}</h3>
            `;

            posSumContainer.textContent = reviews[0][0].summary_text;
            negSumContainer.textContent = reviews[1][0].summary_text;

            appendChart1();
            appendChart2(pos_num, neg_num);

            destroyLoadingBar();

        })
        .catch(error => {
            console.error("Error:", error);
        });
}


function destroyChart() {

    var chart1 = Chart.getChart("chart1");
    if (chart1) {
        chart1.destroy();
        console.log('destroy 1');
    }

    var chart2 = Chart.getChart("chart2");
    if (chart2) {
        chart2.destroy();
        console.log('destroy 2')
    }
}

function appendChart1() {

    const data = {
        labels: ['음식점', '서울시 평균', '전체 평균'],
        datasets: [{
            label: '상대점수 비교',
            backgroundColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
            borderColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
            barPercentage: 1,
            barThickness: 50,
            data: [-1.3, 2.4, -5.3,]
        }]
    };

    var ctx = document.getElementById('chart1').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'bar', // 
        data: data
    });
}



function appendChart2(pos_num, neg_num) {

    const data = {
        labels: ['긍정 리뷰', '부정 리뷰'],
        datasets: [{
            data: [pos_num * 100 / (pos_num + neg_num), neg_num * 100 / (pos_num + neg_num)],
            backgroundColor: ['#ECC7B3', '#B8E3D8'],
            hoverBackgroundColor: ['#F9DEC2', '#CBE8EC']
        }]
    };

    const options = {
        cutoutPercentage: 50,
        responsive: true,
        maintainAspectRatio: false
    };


    const ctx = document.getElementById('chart2').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    }
    );
}

//  클릭하면 해당 주소로 이동하는 함수
function moveToKakaoMap() {
    window.open("http://place.map.kakao.com/" + currentId, "_blank");
}

function goBackToMainPage() {
    window.history.back();
}