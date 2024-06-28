function testing(){
    let listObject = [
        {
            name: "test",
            value: "2"
        },
        {
            name: "test2",
            value: "3"
        }
    ]

    let test = listObject.find((obj: { name: string; }) => {
        return obj.name === "test";
    });
    test!.value = "4";
    console.log(listObject);
}

testing();
