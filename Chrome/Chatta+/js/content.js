/*///////////////////////////////////////////////////
///    Licensed under the BSD 3-Clause license   ///
///////////////////////////////////////////////////
///            (c) 2022 schiatta.it            ///
/////////////////////////////////////////////////
///              Chatta+ by WiS              ///
/////////////////////////////////////////////*/

(() => {
    var s1 = document.createElement('script');
    s1.src = chrome.runtime.getURL('/js/lib/adapter-latest.js');
    s1.setAttribute('type', 'module');
    (document.head || document.documentElement).appendChild(s1);

    var s2 = document.createElement('script');
    s2.src = chrome.runtime.getURL('/js/lib/wavesurfer.js');
    (document.head || document.documentElement).appendChild(s2);

    s2.onload = () => {
        var s4 = document.createElement('script');
        s4.src = chrome.runtime.getURL('/js/main.js');
        s4.setAttribute('type', 'module');
        (document.head || document.documentElement).appendChild(s4);
    
        setTimeout(() => {
            var l1 = document.createElement('link');
            l1.href = chrome.runtime.getURL('/css/style.css');
            l1.type = 'text/css';
            l1.rel = 'stylesheet';
            l1.media = 'all';
            (document.head || document.documentElement).appendChild(l1);
        },100);
        setTimeout(() => {
			var l2 = document.createElement("link");
			l2.href = "https://unpkg.com/css.gg/icons/all.css";
			l2.type = "text/css";
			l2.rel = "stylesheet";
			l2.media = "all";
			(document.head || document.documentElement).appendChild(l2);
		}, 100);
    };
})();