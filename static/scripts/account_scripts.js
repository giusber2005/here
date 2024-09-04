
document.addEventListener('DOMContentLoaded', function() {
    
    var photoFileName = document.getElementById('PhotoFile').textContent.trim();
    var imagePath = 'static/profile_images/' + photoFileName;
    document.getElementById('PhotoPreview').src = imagePath;

    // Select the container by its ID
    let container = document.getElementById('optionalContainer');

    // Select all input elements inside the container
    let cards = container.querySelectorAll('.optionalCards');

    cards.forEach(card => {

        value = card.querySelector(".optionalValues");

        // Check if the input's value is "None"
        if (value.innerHTML === "None") {
            // Traverse up the DOM to find the closest form that contains this input
            let form = card.querySelector('form');
            
            // Now, select the button inside this form
            let button = form.querySelector('button');

            // Hide the button
            button.style.display = "none"; 
        }
    });

});
