events.userReady.push(function() {
    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog")).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.replace("index.html");
        } else {
            snapshot.forEach(function(childSnapshot) {
                if (document.activeElement != $(".setting[data-setting='" + childSnapshot.key + "']")[0]) {
                    if ($(".setting[data-setting='" + childSnapshot.key + "']").attr("type") == "checkbox") {
                        $(".setting[data-setting='" + childSnapshot.key + "']").prop("checked", childSnapshot.val() == true);
                    } else {
                        $(".setting[data-setting='" + childSnapshot.key + "']").val(childSnapshot.val());
                    }
                }
            });
        }
    });
});

function updateSetting(setting) {
    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/" + setting).set(
        $(".setting[data-setting='" + setting + "']").attr("type") == "checkbox" ?
        $(".setting[data-setting='" + setting + "']").prop("checked") :
        $(".setting[data-setting='" + setting + "']").val()
    );
}