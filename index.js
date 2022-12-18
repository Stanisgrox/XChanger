//Импорт библиотеки Cashify
import {Cashify} from './node_modules/cashify/dist/index.js';

//Глобальные переменные
var mainCurrency = localStorage.getItem('mainCurrency');
var apiKey = localStorage.getItem('APIKey');
var jsonSource = './data/exchange.json'
var currnentPage = 'main';


//Функция активации элементов UI при запуске приложения
function initiateUI(){
	//Если это первый запуск приложения, то базовая валюта будет установлена как российский рубль
	if (!mainCurrency){localStorage.setItem('mainCurrency', 'RUB');}
	//Установка API ключа.
	if (!apiKey){localStorage.setItem('APIKey', 'a818ba787dc34767840d0f087d724917')}
	//Загрузка кода главной страницы
	changePage('main');
	//Заполнение таблицы
	fillTable(mainCurrency);
	//Установка триггеров на кнопки меню
	document.getElementById('link-mainpage').addEventListener( "click", () => changePage('main'));
	document.getElementById('link-calculator').addEventListener( "click", () => changePage('calculator'));
	document.getElementById('link-settings').addEventListener( "click", () => changePage('settings'));
}


function loadJSON(filePath) {
	// Загрузка JSON объекта;
	var json = loadTextFileAjaxSync(filePath, "application/json");
	// JSON -> obj
	return JSON.parse(json);
}  

//Синхронный зарос. Асинхронный запрос может выдать ошибку
function loadTextFileAjaxSync(filePath, mimeType)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET",filePath,false);
	if (mimeType != null) {
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType(mimeType);
		}
	}
	xmlhttp.send();
	if (xmlhttp.status==200 && xmlhttp.readyState == 4 )
	{
		return xmlhttp.responseText;
	}
	if (xmlhttp.status==403){
		return false
	}
}
//Функция получения HTML кода
function loadHTML(href)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", href, false);
	xmlhttp.send();
	return xmlhttp.responseText;
}
//Загрузка кешированного JSON с openexchangerates. Кеширование сделано, чтобы сэкономить использования API
var exchangeTable = loadJSON(jsonSource);
//Извлечение таблицы соотношений. В бесплатной версии все измерено относительно USD
var rates = exchangeTable.rates;

var cashify = new Cashify({base: 'USD', rates});


//Заполнение таблицы курсов на главной странице
function fillTable (monetae){
	let uiTableFields = document.getElementById('exchangeTable').children;
	Object.keys(uiTableFields).forEach(key => {
		//Превращаем "fromUSD" в "USD"
		let currency = uiTableFields[key].id.substring(4);
		//Формат запроса в формате 1 RUB to USD
		let exchangeQuerry = '1' + currency + ' to ' + monetae;
		//Формат вывода на основную страницу 1 USD = 63.40 RUB
		let toWrite = '1 ' + currency + ' = ' + cashify.convert(exchangeQuerry).toFixed(2) + ' ' + monetae
		//Запись на основную страницу
		document.getElementById(uiTableFields[key].id).innerHTML = toWrite;
		//Изменение текста над таблицей
		document.getElementById('mainCurrency').innerHTML = '(' + monetae + ')';
	});
	//Определить последнее обновление по UNIX timestamp в JSON
	var timestamp = new Date(exchangeTable.timestamp*1000);
	document.getElementById('timestamp').innerHTML = timestamp;
}
//Проверка валютного кода в поле ввода настроек
function checkCurrencyInput(){
	let foundMatch = false;
	let input = document.getElementById('currency');
	let field = Object.keys(rates);
	//Установка uppercase - "защита от дурака"
	let value = input.value.toUpperCase();
	input.classList.remove('is-valid');
	//Проверка соответствия value input и ключа из таблицы валют
	for (var i = 0; i < field.length; i++){
		if (field[i] == value){
			//Смена индикации input
			input.classList.remove('is-invalid');
			input.classList.add('is-valid');
			foundMatch = true;
			break;
		}
	}
	
	if (!foundMatch){
		input.classList.add('is-invalid');
	}
	return foundMatch;
}
//Применение настроек и перезагрузка главной страницы
function applySettings(){
	let currency = document.getElementById('currency').value.toUpperCase();
	if (checkCurrencyInput()){
		mainCurrency = currency;
		localStorage.setItem('mainCurrency', currency);
		changePage('main');
		fillTable (currency);
	}
	return
}
//Валидация и применение API ключа
function applyAPI(){
	let input = document.getElementById('APIKey');
	let querry = 'https://openexchangerates.org/api/latest.json?app_id=' + input.value;
	let recievedJSON = loadJSON(querry);
	//Если сервер API дал ответ 403
	if (!recievedJSON) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		return;
	}
	//Если получен JSON
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
	apiKey = input.value;
	localStorage.setItem('APIKey', input.value);
	window.open(querry, '_blank')
}

//Отключение кеша
function changeSource(){
	jsonSource = 'https://openexchangerates.org/api/latest.json?app_id=' + apiKey;
	changePage('main');
	//Перезаполнение таблицы и стирание кеша из RAM
	exchangeTable = loadJSON(jsonSource);
	rates = exchangeTable.rates;
	cashify = new Cashify({base: 'USD', rates});
	fillTable (mainCurrency);
}

//Функция смены страницы
function changePage(page){
	//При смене страницы достаточно заменить состав контейнера main
	let content = document.getElementById('content');
	if (page == 'calculator'){
		content.innerHTML = loadHTML('pages/calculator.html');
		document.getElementById('calculate').addEventListener( "click", () => calculate());
		//Замена активных классов в меню
		document.getElementById('link-mainpage').classList.remove('active');
		document.getElementById('link-calculator').classList.add('active');
		document.getElementById('link-settings').classList.remove('active');
		currnentPage = page;
		return
	}
	if (page == 'main'){
		content.innerHTML = loadHTML('pages/main.html');
		fillTable(mainCurrency);
		//Замена активных классов в меню
		document.getElementById('link-mainpage').classList.add('active');
		document.getElementById('link-calculator').classList.remove('active');
		document.getElementById('link-settings').classList.remove('active');
		currnentPage = page;
		return
	}
	if (page == 'settings'){
		content.innerHTML = loadHTML('pages/settings.html');
		document.getElementById('currency').addEventListener( "change", () => checkCurrencyInput());
		document.getElementById('set').addEventListener( "click", () => applySettings());
		document.getElementById('setAPI').addEventListener( "click", () => applyAPI());
		document.getElementById('updateDB').addEventListener( "click", () => window.open('https://openexchangerates.org/api/latest.json?app_id=' + apiKey, '_blank'));
		document.getElementById('changeSource').addEventListener( "click", () => changeSource());
		document.getElementById('currency').setAttribute('placeholder', mainCurrency);
		document.getElementById('APIKey').setAttribute('placeholder', apiKey);
		//Замена активных классов в меню
		document.getElementById('link-mainpage').classList.remove('active');
		document.getElementById('link-calculator').classList.remove('active');
		document.getElementById('link-settings').classList.add('active');
		currnentPage = page;
		return
	}
}

//Функционал калькулятора

function calculate(){
	let exchangeQuerry = document.getElementById('converter').value;
	let result = cashify.convert(exchangeQuerry).toFixed(2);
	document.getElementById('conversionResult').innerHTML = 'Результат: ' + result;
}

initiateUI();