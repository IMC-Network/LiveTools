var settingsPath = "";

events.userReady.push(function() {
    if (getURLParameter("prog") == null) {
        window.location.replace("index.html");
    } else {
        if (getURLParameter("episode") != null) {
            settingsPath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes/" + getURLParameter("episode");
        } else if (getURLParameter("template") != null) {
            settingsPath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates/" + getURLParameter("template");            
        } else {
            settingsPath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog");
        }
    }

    firebase.database().ref(settingsPath).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.replace("index.html");
        } else {
            snapshot.forEach(function(childSnapshot) {
                if (document.activeElement != $(".setting[data-setting='" + childSnapshot.key + "']")[0]) {
                    if ($(".setting[data-setting='" + childSnapshot.key + "']").attr("type") == "checkbox") {
                        $(".setting[data-setting='" + childSnapshot.key + "']").prop("checked", childSnapshot.val() == true);
                    } else if ($(".setting[data-setting='" + childSnapshot.key + "']").attr("type") == "datetime-local") {
                        $(".setting[data-setting='" + childSnapshot.key + "']").val(
                            new Date(childSnapshot.val()).toISOString().split(":")[0] + ":" + new Date(childSnapshot.val()).toISOString().split(":")[1]
                        );
                    } else {
                        $(".setting[data-setting='" + childSnapshot.key + "']").val(childSnapshot.val());
                    }
                }
            });
        }
    });
});

function updateSetting(setting) {
    if ($(".setting[data-setting='" + setting + "']").attr("type") == "checkbox") {
        firebase.database().ref(settingsPath + "/" + setting).set($(".setting[data-setting='" + setting + "']").prop("checked") == true);
    } else if ($(".setting[data-setting='" + setting + "']").attr("type") == "datetime-local") {
        firebase.database().ref(settingsPath + "/" + setting).set(new Date($(".setting[data-setting='" + setting + "']").val().trim()).getTime());
    } else {
        if ($(".setting[data-setting='" + setting + "']").attr("data-optional") == "true") {
            firebase.database().ref(settingsPath + "/" + setting).set($(".setting[data-setting='" + setting + "']").val().trim() == "" ? null : $(".setting[data-setting='" + setting + "']").val().trim());
        } else {
            firebase.database().ref(settingsPath + "/" + setting).set($(".setting[data-setting='" + setting + "']").val().trim());
        }
    }
}