# 学生随机点名

效果如下：
![](GIF.gif)

    js代码：
```angular2
	window.onload = function () {
		var stu = ["李卓锟","陈杰","韦雄","孙燕春","张辉","范玉伟","严波","李凯晴","崔明勇","李毅强","谭浩根","赵来荣","吴荣荣","苏祥希","陈炫林","幸文杰","黎家辉"],//配置学生姓名
				box = document.querySelector(".box"),
				btn = document.querySelector(".start_choose_name");
		for (var i = 0; i < stu.length; i++){
			var div = document.createElement("div");
			div.setAttribute("class","stu_name");
			div.innerText = stu[i];
			box.appendChild(div);
		}
		/**
		 * 禁止选择
		 */
		document.onselectstart = function () {
			return false
		};
		var allowClick = true,
				colorTimes = 0,
				timer,
				stuNameArray = document.querySelectorAll(".box>.stu_name");
		btn.onclick = function () {
			if (allowClick) {
				allowClick = false;
				btn.innerText = "点名中";
				timer = setInterval(function () {
					colorTimes ++;
					stuNameArray.forEach(function (item,index) {
						item.style.cssText = "background:"+ color() + ";color:" + color();
					});
					if (colorTimes >= 20) {
						clearInterval(timer);
						allowClick = true;
						colorTimes = 0;
						btn.innerText = "开始点名";
						stuNameArray.forEach(function (item,index) {
							item.style.cssText = "background:orangered;color:white;" ;
						});
						stuNameArray[selected(stuNameArray)].style.cssText = "background:white;color:blueviolet;" ;
					}
				},100)
			}
		};
		/**
		 * 随机的下标 params array 
		 */
		function selected(array) {
			return Math.floor(Math.random() * array.length)
		}
		/*随机的颜色封装函数*/
		function color() {
			var r = Math.floor(Math.random() * 256);
			var g = Math.floor(Math.random() * 256);
			var b = Math.floor(Math.random() * 256);
			return 'rgb(' + r + ',' + g + ',' + b + ')'
		}
	};
```    
