const HUMAN_AVERAGE_WPM = 150;

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

    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).on("value", function(snapshot) {
        if (snapshot.val().command == "scrollSection") {
            var from = snapshot.val().from || 0;
            var currentScrollElement = $(".section[data-key='" + snapshot.val().sectionKey + "'] .sectionContent *:first");

            function scrollElement() {
                $("html").scrollTop(currentScrollElement.offset().top - 20 - ($(window).height() / 2));

                $("html").animate({
                    scrollTop: currentScrollElement.offset().top + currentScrollElement.height() - ($(window).height() / 2),
                }, {
                    duration: (Number(currentScrollElement.attr("data-duration"))* 1000) || getTextDuration(currentScrollElement.text()),
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
        }
    });
});