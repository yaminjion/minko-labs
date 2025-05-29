// Инициализация данных
let currentRates = {};
let historicalData = [];
let currentBYNRate = 0;

// Загрузка текущих курсов
function loadCurrentRates() {
    fetch('https://www.cbr-xml-daily.ru/daily_json.js')
        .then(response => response.json())
        .then(data => {
            currentRates = data;
            currentBYNRate = data.Valute.BYN.Value;
            
            // Обновляем информацию о курсах
            document.getElementById('BYN').innerHTML = `Белорусский рубль — ${data.Valute.BYN.Value.toFixed(4).replace('.', ',')} руб.`;
            document.getElementById('USD').innerHTML = `Доллар США — ${data.Valute.USD.Value.toFixed(4).replace('.', ',')} руб.`;
            document.getElementById('EUR').innerHTML = `Евро — ${data.Valute.EUR.Value.toFixed(4).replace('.', ',')} руб.`;
            
            // Обновляем время
            const updateTime = new Date(data.Date);
            document.getElementById('update-time').textContent = updateTime.toLocaleString('ru-RU');
            
            // Инициализируем money.js
            fx.rates = {
                "RUB": 1,
                "BYN": 1 / data.Valute.BYN.Value
            };
        })
        .catch(error => {
            console.error('Ошибка загрузки курсов:', error);
            document.getElementById('update-time').textContent = 'ошибка загрузки';
        });
}

// Загрузка исторических данных
function loadHistoricalData() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    
    const dateFormat = (date) => date.toISOString().split('T')[0];
    
    fetch(`https://www.cbr-xml-daily.ru/archive/${dateFormat(startDate)}/${dateFormat(endDate)}/daily_json.js`)
        .then(response => response.json())
        .then(data => {
            // Обрабатываем данные для графика
            historicalData = Object.entries(data)
                .filter(([date]) => date in data)
                .map(([date, rates]) => ({
                    date,
                    rate: rates.Valute.BYN.Value
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            renderChart();
        })
        .catch(error => {
            console.error('Ошибка загрузки исторических данных:', error);
        });
}

// Отрисовка графика
function renderChart() {
    const ctx = document.getElementById('currency-chart').getContext('2d');
    
    const labels = historicalData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const data = historicalData.map(item => item.rate);
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Курс BYN к RUB',
                data: data,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(0, 0, 0, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Курс (RUB)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата'
                    }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const item = historicalData[index];
                    document.getElementById('chart-info').innerHTML = `
                        <strong>${new Date(item.date).toLocaleDateString('ru-RU')}</strong>: 
                        1 BYN = ${item.rate.toFixed(4)} RUB
                    `;
                    
                    // Подсветка выбранного столбца
                    chart.data.datasets[0].backgroundColor = chart.data.datasets[0].backgroundColor.map((color, i) => 
                        i === index ? 'rgba(200, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                    );
                    chart.update();
                }
            }
        }
    });
}

// Конвертация валют
function convertCurrency(from, to, amount) {
    try {
        if (from === 'RUB' && to === 'BYN') {
            return fx(amount).from("RUB").to("BYN");
        } else if (from === 'BYN' && to === 'RUB') {
            return fx(amount).from("BYN").to("RUB");
        }
        return 0;
    } catch (e) {
        console.error('Ошибка конвертации:', e);
        return 0;
    }
}

// Обработчики событий
document.getElementById('convert-to-byn').addEventListener('click', () => {
    const rubAmount = parseFloat(document.getElementById('amount-rub').value);
    if (!isNaN(rubAmount) && rubAmount >= 0) {
        const bynAmount = convertCurrency('RUB', 'BYN', rubAmount);
        document.getElementById('amount-byn').value = bynAmount.toFixed(4);
    }
});

document.getElementById('convert-to-rub').addEventListener('click', () => {
    const bynAmount = parseFloat(document.getElementById('amount-byn').value);
    if (!isNaN(bynAmount) && bynAmount >= 0) {
        const rubAmount = convertCurrency('BYN', 'RUB', bynAmount);
        document.getElementById('amount-rub').value = rubAmount.toFixed(4);
    }
});

document.getElementById('reset-calc').addEventListener('click', () => {
    document.getElementById('amount-rub').value = '';
    document.getElementById('amount-byn').value = '';
});

// Автоматическая конвертация при вводе
document.getElementById('amount-rub').addEventListener('input', (e) => {
    if (e.target.value && !isNaN(e.target.value)) {
        const bynAmount = convertCurrency('RUB', 'BYN', parseFloat(e.target.value));
        document.getElementById('amount-byn').value = bynAmount.toFixed(4);
    } else {
        document.getElementById('amount-byn').value = '';
    }
});

document.getElementById('amount-byn').addEventListener('input', (e) => {
    if (e.target.value && !isNaN(e.target.value)) {
        const rubAmount = convertCurrency('BYN', 'RUB', parseFloat(e.target.value));
        document.getElementById('amount-rub').value = rubAmount.toFixed(4);
    } else {
        document.getElementById('amount-rub').value = '';
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentRates();
    loadHistoricalData();
    
    // Кнопка "наверх"
    window.onscroll = function() {
        const toTopBtn = document.querySelector('.to-top');
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            toTopBtn.style.display = 'block';
        } else {
            toTopBtn.style.display = 'none';
        }
    };
});