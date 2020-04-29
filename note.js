
/*
let classObj={//选择器节点
    selector_: ".ident-class",
    contents_:[
        {//对象样式节点
            borderLeft:'2px solid #000',
            borderRight:'2px solid #000',
            color:"#633",
        },
        {//对象样式节点
            color:"#822",
            backgroundColot:"#fcc",
        },
        "padding:5px 6px;",//字符串样式节点
        //含选择器字符串样式节点
        `.str-sel-node-1{/*scss的风格 后代选择器*-/
            margin: 4px 6px
        }
        /*自动删除中间的注释*-/
        &.str-sel-node-2{/*scss的风格 父选择器*-/
            margin: 4px 6px
        }`,
        {//选择器节点
            selector_:".aaa",/*scss的风格 后代选择器*-/
            contents_:[
                {
                    color:"#666",
                    fontSize:"12px"
                },
                {
                    selector_:"&.bbb",/*scss的风格 父选择器*-/
                    contents_:[{
                        color:"#666",
                        fontSize:"12px"
                    }],
                }
            ],
        },
        {
            selector_:".ccc",
            contents_:[{
                color:"#666",
                fontSize:"12px",
            }],
        }
    ]
}
classObjBuild(classObj)
*/
/*
conjunction 属性里需要替换为连词符的标识(选择器的涨幅不会被替换)
*/
const classObjBuild=function(obj, conjunction='' ){
    if(Array.isArray(obj)){//统一输入格式
        obj = {
            selector_:"",
            contents_:[obj],
        }
    }
    let re = conjunction && RegExp(`[${conjunction}]`,'g')
    let ret = ""
    let itemProcess = function(t,s,d,p,pi){
        //todo 字符串类型
        if(Array.isArray(t.contents_)){//非末级节点
            let nodeMake = function(sel,cont){
                return `${sel}{\n${cont}\n}\n`
            }
            let selector
            //非选择器节点节点
            let objStyles = []   //对象样式节点
            let strStyles = []   //字符串样式节点
            let strSelStyles = []//含选择器字符串样式节点

            t.contents_.forEach((v,i,a)=>{
                if(!Array.isArray(v.contents_)){//非选择器节点
                    if(typeof(v)=='object'){
                        objStyles.push(v)
                    }else if(typeof(v)=='string'){
                        if(/\{/.test(v)){ //包含选择器
                            strSelStyles.push(v)
                        }else{//无选择器
                            strStyles.push(v)
                        }
                    }
                }
            })
            if(objStyles.length||strStyles.length||strSelStyles.length){
                selector = p.map(v=>v.selector_).join(' ').replace(/\s+\&/g,'') //构造选择器
            }

            // console.log(objStyles, strStyles, strSelStyles)


            if(objStyles.length){//对象样式节点
                let stylesStrs= []
                objStyles.forEach((v,i,a)=>{ //遍历样式节点
                    Object.keys(v).forEach((av,ai,aa)=>{//遍历Attribute
                        let field = av.replace(/\w([A-Z])/g,"-$1").toLocaleLowerCase()
                        re && ( field = field.replace(re,'-'))
                        let value = v[av]
                        stylesStrs.push(`${field}:${value};`)
                    })
                })
                let styleItem = nodeMake(selector,stylesStrs.join('\n'))
                // console.log(Array.from(p),selector,stylesStrs)
                // console.log(styleItem)
                ret+=styleItem
            }
            if(strStyles.length){//字符串样式节点
                ret+=nodeMake(selector,strStyles.join('\n'))
            }
            if(strSelStyles.length){//含选择器字符串样式节点
                // let stylesStrs = []
                strSelStyles.forEach((v,i,a)=>{
                    let strItem = v.replace(/}(\s*(\/\*.*\*\/)?)*/g,'}/*-s-*/').split('/*-s-*/')
                    strItem.forEach((sv,si,sa)=>{
                        let styleItem = ''
                        if(sv){
                            if(sv[0]=='&'){
                                styleItem = `${selector}${sv.slice(1)}\n`
                            }else{
                                styleItem = `${selector} ${sv}\n`
                            }

                            ret+=styleItem
                        }
                    })
                })
            }
        }
    }
    common.traverseTree(obj,"contents_",null,itemProcess)

    return ret
}
