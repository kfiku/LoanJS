import { TableRow } from './TableRow';

let tr = new TableRow();

let tableRowList = document.getElementById('mainTbody');
let trEl = tr.render();

tableRowList.appendChild(trEl);
