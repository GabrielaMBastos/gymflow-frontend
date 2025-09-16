document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("login-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();


        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        
        if(!email || !senha){
            alert("Preencha todos os campos!")
            return;
        }

        try{
            const response = await fetch("http://localhost:8080/api/login" , {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, senha})
            });

            if(response.ok){
                const data = await response.json();
                localStorage.setItem("token", data.token);
                window.location.href ="/home.html";
            }else {
                alert("Email ou senha inválidos!")
            }
        } catch(error){
            console.error(error);
            alert("Erro de conexão com o servidor.");  
        }
        
    });
});