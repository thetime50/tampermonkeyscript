/*
let classObj={
    selector: ".ident-class",
    contents:[
        {backgroundColot:"#fcc"},
        {color:"#822"},
        {
            selector:".aaa",
            contents:[
                {color:"#666"},
                {fontSize:"12px"},
                {
                    selector:"&.bbb",
                    contents:[
                        {color:"#666"},
                        {fontSize:"12px"},
                    ],
                }
            ],
        },
        {
            selector:".ccc",
            contents:[
                {color:"#666"},
                {fontSize:"12px"},
            ],
        }
    ]
}
*/

const classObjBuild=function(obj){
    if(Array.isArray(obj)){
        obj = {
            selector:"",
            contents:[obj],
        }
    }
    let ret = ""
    let itemProcess = function(t,s,d,p,pi){
        if(Array.isArray(t.contents)){//非末级节点
            let styles=t.contents.filter((v,i,a)=>{
                return !Array.isArray(v.contents)
            })
            if(styles.length){
                let selector = p.map(v=>v.selector).join(' ').replace(/\s\&/,'')
                let stylesStr= styles.map((v,i,a)=>{
                    let field = Object.keys(v)[0].replace(/\w([A-Z])/g,"-$1").toLocaleLowerCase()
                    let value = Object.values(v)[0]
                    return `${field}:${value};`
                })
                let styleItem = selector+"{\n"+stylesStr.join('\n')+"\n}\n"
                // console.log(Array.from(p),selector,stylesStr)
                // console.log(styleItem)
                ret+=styleItem
            }
        }
    }
    common.traverseTree(obj,"contents",null,itemProcess)

    return ret
}
