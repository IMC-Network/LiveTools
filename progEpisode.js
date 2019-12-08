var episodePath = "";

events.userReady.push(function() {
    if (getURLParameter("prog") == null) {
        window.location.replace("index.html");
    } else {
        if (getURLParameter("episode") != null) {
            episodePath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes/" + getURLParameter("episode");
        } else if (getURLParameter("template") != null) {
            episodePath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates/" + getURLParameter("template");
        }
    }

    firebase.database().ref(episodePath).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.replace("prog.html?prog=" + getURLParameter("prog"));
        } else {
            $(".progEpisodeName").text(snapshot.val().slug || "Untitled");

            if (getURLParameter("episode") != null) {
                $(".progEpisodeLink").attr("href", "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&episode=" + encodeURIComponent(getURLParameter("episode")));
            } else if (getURLParameter("template") != null) {
                $(".progEpisodeLink").attr("href", "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&template=" + encodeURIComponent(getURLParameter("template")));
            }
        }

        $(".pageLoader").hide();
        $(".loadingSection").show();
    });
});