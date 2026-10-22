// Библиотека графиков (учебная имитация): 200 видов графиков, дашборду нужен один — линейный.
// Загружается в <head> без defer и до разбора остальной страницы выполняет «инициализацию».
(function () {
  var charts = {};
  charts.type0 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type0", points: data.length, max: max };
  };
  charts.type1 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type1", points: data.length, max: max };
  };
  charts.type2 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type2", points: data.length, max: max };
  };
  charts.type3 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type3", points: data.length, max: max };
  };
  charts.type4 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type4", points: data.length, max: max };
  };
  charts.type5 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type5", points: data.length, max: max };
  };
  charts.type6 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type6", points: data.length, max: max };
  };
  charts.type7 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type7", points: data.length, max: max };
  };
  charts.type8 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type8", points: data.length, max: max };
  };
  charts.type9 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type9", points: data.length, max: max };
  };
  charts.type10 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type10", points: data.length, max: max };
  };
  charts.type11 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type11", points: data.length, max: max };
  };
  charts.type12 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type12", points: data.length, max: max };
  };
  charts.type13 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type13", points: data.length, max: max };
  };
  charts.type14 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type14", points: data.length, max: max };
  };
  charts.type15 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type15", points: data.length, max: max };
  };
  charts.type16 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type16", points: data.length, max: max };
  };
  charts.type17 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type17", points: data.length, max: max };
  };
  charts.type18 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type18", points: data.length, max: max };
  };
  charts.type19 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type19", points: data.length, max: max };
  };
  charts.type20 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type20", points: data.length, max: max };
  };
  charts.type21 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type21", points: data.length, max: max };
  };
  charts.type22 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type22", points: data.length, max: max };
  };
  charts.type23 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type23", points: data.length, max: max };
  };
  charts.type24 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type24", points: data.length, max: max };
  };
  charts.type25 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type25", points: data.length, max: max };
  };
  charts.type26 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type26", points: data.length, max: max };
  };
  charts.type27 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type27", points: data.length, max: max };
  };
  charts.type28 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type28", points: data.length, max: max };
  };
  charts.type29 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type29", points: data.length, max: max };
  };
  charts.type30 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type30", points: data.length, max: max };
  };
  charts.type31 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type31", points: data.length, max: max };
  };
  charts.type32 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type32", points: data.length, max: max };
  };
  charts.type33 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type33", points: data.length, max: max };
  };
  charts.type34 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type34", points: data.length, max: max };
  };
  charts.type35 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type35", points: data.length, max: max };
  };
  charts.type36 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type36", points: data.length, max: max };
  };
  charts.type37 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type37", points: data.length, max: max };
  };
  charts.type38 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type38", points: data.length, max: max };
  };
  charts.type39 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type39", points: data.length, max: max };
  };
  charts.type40 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type40", points: data.length, max: max };
  };
  charts.type41 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type41", points: data.length, max: max };
  };
  charts.type42 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type42", points: data.length, max: max };
  };
  charts.type43 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type43", points: data.length, max: max };
  };
  charts.type44 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type44", points: data.length, max: max };
  };
  charts.type45 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type45", points: data.length, max: max };
  };
  charts.type46 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type46", points: data.length, max: max };
  };
  charts.type47 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type47", points: data.length, max: max };
  };
  charts.type48 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type48", points: data.length, max: max };
  };
  charts.type49 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type49", points: data.length, max: max };
  };
  charts.type50 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type50", points: data.length, max: max };
  };
  charts.type51 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type51", points: data.length, max: max };
  };
  charts.type52 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type52", points: data.length, max: max };
  };
  charts.type53 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type53", points: data.length, max: max };
  };
  charts.type54 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type54", points: data.length, max: max };
  };
  charts.type55 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type55", points: data.length, max: max };
  };
  charts.type56 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type56", points: data.length, max: max };
  };
  charts.type57 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type57", points: data.length, max: max };
  };
  charts.type58 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type58", points: data.length, max: max };
  };
  charts.type59 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type59", points: data.length, max: max };
  };
  charts.type60 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type60", points: data.length, max: max };
  };
  charts.type61 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type61", points: data.length, max: max };
  };
  charts.type62 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type62", points: data.length, max: max };
  };
  charts.type63 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type63", points: data.length, max: max };
  };
  charts.type64 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type64", points: data.length, max: max };
  };
  charts.type65 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type65", points: data.length, max: max };
  };
  charts.type66 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type66", points: data.length, max: max };
  };
  charts.type67 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type67", points: data.length, max: max };
  };
  charts.type68 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type68", points: data.length, max: max };
  };
  charts.type69 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type69", points: data.length, max: max };
  };
  charts.type70 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type70", points: data.length, max: max };
  };
  charts.type71 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type71", points: data.length, max: max };
  };
  charts.type72 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type72", points: data.length, max: max };
  };
  charts.type73 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type73", points: data.length, max: max };
  };
  charts.type74 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type74", points: data.length, max: max };
  };
  charts.type75 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type75", points: data.length, max: max };
  };
  charts.type76 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type76", points: data.length, max: max };
  };
  charts.type77 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type77", points: data.length, max: max };
  };
  charts.type78 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type78", points: data.length, max: max };
  };
  charts.type79 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type79", points: data.length, max: max };
  };
  charts.type80 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type80", points: data.length, max: max };
  };
  charts.type81 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type81", points: data.length, max: max };
  };
  charts.type82 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type82", points: data.length, max: max };
  };
  charts.type83 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type83", points: data.length, max: max };
  };
  charts.type84 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type84", points: data.length, max: max };
  };
  charts.type85 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type85", points: data.length, max: max };
  };
  charts.type86 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type86", points: data.length, max: max };
  };
  charts.type87 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type87", points: data.length, max: max };
  };
  charts.type88 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type88", points: data.length, max: max };
  };
  charts.type89 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type89", points: data.length, max: max };
  };
  charts.type90 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type90", points: data.length, max: max };
  };
  charts.type91 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type91", points: data.length, max: max };
  };
  charts.type92 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type92", points: data.length, max: max };
  };
  charts.type93 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type93", points: data.length, max: max };
  };
  charts.type94 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type94", points: data.length, max: max };
  };
  charts.type95 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type95", points: data.length, max: max };
  };
  charts.type96 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type96", points: data.length, max: max };
  };
  charts.type97 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type97", points: data.length, max: max };
  };
  charts.type98 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type98", points: data.length, max: max };
  };
  charts.type99 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type99", points: data.length, max: max };
  };
  charts.type100 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type100", points: data.length, max: max };
  };
  charts.type101 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type101", points: data.length, max: max };
  };
  charts.type102 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type102", points: data.length, max: max };
  };
  charts.type103 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type103", points: data.length, max: max };
  };
  charts.type104 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type104", points: data.length, max: max };
  };
  charts.type105 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type105", points: data.length, max: max };
  };
  charts.type106 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type106", points: data.length, max: max };
  };
  charts.type107 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type107", points: data.length, max: max };
  };
  charts.type108 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type108", points: data.length, max: max };
  };
  charts.type109 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type109", points: data.length, max: max };
  };
  charts.type110 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type110", points: data.length, max: max };
  };
  charts.type111 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type111", points: data.length, max: max };
  };
  charts.type112 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type112", points: data.length, max: max };
  };
  charts.type113 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type113", points: data.length, max: max };
  };
  charts.type114 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type114", points: data.length, max: max };
  };
  charts.type115 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type115", points: data.length, max: max };
  };
  charts.type116 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type116", points: data.length, max: max };
  };
  charts.type117 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type117", points: data.length, max: max };
  };
  charts.type118 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type118", points: data.length, max: max };
  };
  charts.type119 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type119", points: data.length, max: max };
  };
  charts.type120 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type120", points: data.length, max: max };
  };
  charts.type121 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type121", points: data.length, max: max };
  };
  charts.type122 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type122", points: data.length, max: max };
  };
  charts.type123 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type123", points: data.length, max: max };
  };
  charts.type124 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type124", points: data.length, max: max };
  };
  charts.type125 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type125", points: data.length, max: max };
  };
  charts.type126 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type126", points: data.length, max: max };
  };
  charts.type127 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type127", points: data.length, max: max };
  };
  charts.type128 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type128", points: data.length, max: max };
  };
  charts.type129 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type129", points: data.length, max: max };
  };
  charts.type130 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type130", points: data.length, max: max };
  };
  charts.type131 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type131", points: data.length, max: max };
  };
  charts.type132 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type132", points: data.length, max: max };
  };
  charts.type133 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type133", points: data.length, max: max };
  };
  charts.type134 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type134", points: data.length, max: max };
  };
  charts.type135 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type135", points: data.length, max: max };
  };
  charts.type136 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type136", points: data.length, max: max };
  };
  charts.type137 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type137", points: data.length, max: max };
  };
  charts.type138 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type138", points: data.length, max: max };
  };
  charts.type139 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type139", points: data.length, max: max };
  };
  charts.type140 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type140", points: data.length, max: max };
  };
  charts.type141 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type141", points: data.length, max: max };
  };
  charts.type142 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type142", points: data.length, max: max };
  };
  charts.type143 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type143", points: data.length, max: max };
  };
  charts.type144 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type144", points: data.length, max: max };
  };
  charts.type145 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type145", points: data.length, max: max };
  };
  charts.type146 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type146", points: data.length, max: max };
  };
  charts.type147 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type147", points: data.length, max: max };
  };
  charts.type148 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type148", points: data.length, max: max };
  };
  charts.type149 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type149", points: data.length, max: max };
  };
  charts.type150 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type150", points: data.length, max: max };
  };
  charts.type151 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type151", points: data.length, max: max };
  };
  charts.type152 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type152", points: data.length, max: max };
  };
  charts.type153 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type153", points: data.length, max: max };
  };
  charts.type154 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type154", points: data.length, max: max };
  };
  charts.type155 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type155", points: data.length, max: max };
  };
  charts.type156 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type156", points: data.length, max: max };
  };
  charts.type157 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type157", points: data.length, max: max };
  };
  charts.type158 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type158", points: data.length, max: max };
  };
  charts.type159 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type159", points: data.length, max: max };
  };
  charts.type160 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type160", points: data.length, max: max };
  };
  charts.type161 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type161", points: data.length, max: max };
  };
  charts.type162 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type162", points: data.length, max: max };
  };
  charts.type163 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type163", points: data.length, max: max };
  };
  charts.type164 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type164", points: data.length, max: max };
  };
  charts.type165 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type165", points: data.length, max: max };
  };
  charts.type166 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type166", points: data.length, max: max };
  };
  charts.type167 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type167", points: data.length, max: max };
  };
  charts.type168 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type168", points: data.length, max: max };
  };
  charts.type169 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type169", points: data.length, max: max };
  };
  charts.type170 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type170", points: data.length, max: max };
  };
  charts.type171 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type171", points: data.length, max: max };
  };
  charts.type172 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type172", points: data.length, max: max };
  };
  charts.type173 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type173", points: data.length, max: max };
  };
  charts.type174 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type174", points: data.length, max: max };
  };
  charts.type175 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type175", points: data.length, max: max };
  };
  charts.type176 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type176", points: data.length, max: max };
  };
  charts.type177 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type177", points: data.length, max: max };
  };
  charts.type178 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type178", points: data.length, max: max };
  };
  charts.type179 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type179", points: data.length, max: max };
  };
  charts.type180 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type180", points: data.length, max: max };
  };
  charts.type181 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type181", points: data.length, max: max };
  };
  charts.type182 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type182", points: data.length, max: max };
  };
  charts.type183 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type183", points: data.length, max: max };
  };
  charts.type184 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type184", points: data.length, max: max };
  };
  charts.type185 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type185", points: data.length, max: max };
  };
  charts.type186 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type186", points: data.length, max: max };
  };
  charts.type187 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type187", points: data.length, max: max };
  };
  charts.type188 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type188", points: data.length, max: max };
  };
  charts.type189 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type189", points: data.length, max: max };
  };
  charts.type190 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.50;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type190", points: data.length, max: max };
  };
  charts.type191 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type191", points: data.length, max: max };
  };
  charts.type192 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.60;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type192", points: data.length, max: max };
  };
  charts.type193 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type193", points: data.length, max: max };
  };
  charts.type194 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type194", points: data.length, max: max };
  };
  charts.type195 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type195", points: data.length, max: max };
  };
  charts.type196 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.80;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type196", points: data.length, max: max };
  };
  charts.type197 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type197", points: data.length, max: max };
  };
  charts.type198 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.90;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type198", points: data.length, max: max };
  };
  charts.type199 = function (ctx, data, options) {
    var w = options.width, h = options.height, pad = options.padding || 24, max = 0, i, x, y;
    for (i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    ctx.save();
    ctx.strokeStyle = options.color || "#2f6fd0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (i = 0; i < data.length; i++) {
      x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
      y = h - pad - (data[i] / (max || 1)) * (h - pad * 2) * 0.95;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    return { kind: "type199", points: data.length, max: max };
  };
  // «Инициализация»: библиотека заранее считает таблицы для всех видов графиков.
  var tables = [];
  var end = performance.now() + 180;
  while (performance.now() < end) tables.push(Math.sqrt(tables.length));
  window.Charts = { line: charts.type0, all: charts, ready: tables.length > 0 };
})();
