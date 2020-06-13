var sectionOrder = [];
var currentSection = 0;

function controlPlay() {
    if (currentSection < sectionOrder.length) {
        firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).set({
            command: "scrollSection",
            sectionKey: sectionOrder[currentSection]
        });
    }
}

function controlStop() {
    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).set({
        command: "stopSection"
    });
}

function controlPrevious() {
    if (currentSection > 0) {
        currentSection--;
    }

    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).set({
        command: "jumpToSection",
        sectionKey: sectionOrder[currentSection]
    });
}

function controlNext() {
    if (currentSection + 1 < sectionOrder.length) {
        currentSection++;
    }

    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).set({
        command: "jumpToSection",
        sectionKey: sectionOrder[currentSection]
    });
}

function controlRestart() {
    currentSection = 0;

    firebase.database().ref(episodePath + "/sessions/" + getURLParameter("session")).set({
        command: "jumpToSection",
        sectionKey: sectionOrder[currentSection]
    });
}

events.userReady.push(function() {
    if (getURLParameter("prog") != null && getURLParameter("episode") != null && getURLParameter("session") != null) {
        $(".virtualTeleprompter").attr("src",
            "progEpisodeDisplay.html?prog=" + encodeURIComponent(getURLParameter("prog")) +
            "&episode=" + encodeURIComponent(getURLParameter("episode")) +
            "&session=" + encodeURIComponent(getURLParameter("session"))
        );
    }

    firebase.database().ref(episodePath + "/content/script").on("value", function(snapshot) {
        sectionOrder = snapshot.val().sectionOrder;
    });
});