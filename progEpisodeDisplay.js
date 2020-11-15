const HUMAN_AVERAGE_WPM = 150;

var durationStart = new Date();
var durationEnd = new Date();

function getTextDuration(text) {
    return text.trim().split(" ").length * (60 / HUMAN_AVERAGE_WPM) * 1000;
}

function cleanHTML(html) {
    return html.replace(/<script/g, "&lt;script").replace(/<\/script/g, "&lt;/script").replace(/<style/g, "&lt;style").replace(/<\/style/g, "&lt;/style").replace(/<link/g, "&lt;link");
}

function loadTeleprompterScript() {
    firebase.database().ref(episodePath + "/content/script").once("value", function(snapshot) {
        var sectionOrder = snapshot.val().sectionOrder;
        var sectionNames = snapshot.val().sectionNames;
        var sectionContents = snapshot.val().sectionContents;

        $(".teleprompterScript").html("");

        for (var i = 0; i < sectionOrder.length; i++) {
            $(".teleprompterScript").append(
                $("<div class='section'>")
                    .attr("data-key", sectionOrder[i])
                    .append([
                        $("<div class='sectionTitle'>").text(sectionNames[sectionOrder[i]] || "Untitled section"),
                        $("<div class='sectionContent'>").html(cleanHTML(sectionContents[sectionOrder[i]]))
                    ])
            );
        }
    });
}

events.userReady.push(function() {
    loadTeleprompterScript();

    setInterval(function() {
        var currentTime = new Date();

        $(".currentTime").text(
            String(currentTime.getHours()).padStart(2, "0") + ":" +
            String(currentTime.getMinutes()).padStart(2,"0") + ":" +
            String(currentTime.getSeconds()).padStart(2, "0") + ":" +
            String(Math.floor(currentTime.getMilliseconds() * 24 / 1000)).padStart(2, "0")
        );

        var elapsedDuration = currentTime.getTime() - durationStart.getTime();
        var elapsedHours = Math.floor((elapsedDuration / 1000) / 3600);
        var elapsedMinutes = Math.floor((Math.floor(elapsedDuration / 1000) % 3600) / 60);
        var elapsedSeconds = (Math.floor(elapsedDuration / 1000) % 3600) % 60;
        var elapsedFrames = Math.floor((elapsedDuration % 1000) * 24 / 1000);

        $(".elapsedTime").text(
            String(elapsedHours).padStart(2, "0") + ":" +
            String(elapsedMinutes).padStart(2,"0") + ":" +
            String(elapsedSeconds).padStart(2, "0") + ":" +
            String(elapsedFrames).padStart(2, "0")
        );

        var remainingDuration = durationEnd.getTime() - currentTime.getTime();
        var remainingHours = Math.floor((remainingDuration / 1000) / 3600);
        var remainingMinutes = Math.floor((Math.floor(remainingDuration / 1000) % 3600) / 60);
        var remainingSeconds = (Math.floor(remainingDuration / 1000) % 3600) % 60;
        var remainingFrames = Math.floor((remainingDuration % 1000) * 24 / 1000);

        if (remainingDuration >= 0) {
            $(".remainingTime").text(
                String(remainingHours).padStart(2, "0") + ":" +
                String(remainingMinutes).padStart(2,"0") + ":" +
                String(remainingSeconds).padStart(2, "0") + ":" +
                String(remainingFrames).padStart(2, "0")
            );
        } else {
            $(".remainingTime").text("END");
        }
    });

    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).on("value", function(snapshot) {
        if (snapshot.val().command == "scrollSection") {
            var from = snapshot.val().from || 0;
            var currentScrollElement = $(".section[data-key='" + snapshot.val().sectionKey + "'] .sectionContent *:first");

            function scrollElement() {
                $("html").scrollTop(currentScrollElement.offset().top - 20 - ($(window).height() / 2));

                durationStart = new Date();
                durationEnd = new Date(new Date().getTime() + (Number(currentScrollElement.attr("data-duration") * 1000) || getTextDuration(currentScrollElement.text())));

                $("html").animate({
                    scrollTop: currentScrollElement.offset().top + currentScrollElement.height() - ($(window).height() / 2),
                }, {
                    duration: (Number(currentScrollElement.attr("data-duration")) * 1000) || getTextDuration(currentScrollElement.text()),
                    easing: "linear",
                    complete: scrollNextElement
                });
            }

            function getNextElement() {
                if (currentScrollElement.next().length > 0) {
                    currentScrollElement = currentScrollElement.next();
                } else {
                    currentScrollElement = $(currentScrollElement.closest(".section").next().find(".sectionContent *").get(0));
                }
            }

            function scrollNextElement() {
                getNextElement();

                scrollElement();
            }

            $("html").stop();

            if (from == 0) {
                scrollElement();
            } else {
                for (var i = 0; i < from; i++) {
                    getNextElement();
                }

                scrollElement();
            }
        } else if (snapshot.val().command == "stopSection") {
            $("html").stop();
        } else if (snapshot.val().command == "jumpToSection") {
            var currentScrollElement = $(".section[data-key='" + snapshot.val().sectionKey + "'] .sectionContent *:first");

            $("html").animate({
                scrollTop: currentScrollElement.offset().top - ($(window).height() / 2),
            }, {
                duration: 250,
                easing: "linear"
            });
        }
    });
});