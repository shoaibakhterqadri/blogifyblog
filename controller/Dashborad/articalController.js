const categoryModel = require('../../models/categoryModel');
const tagModel = require('../../models/tagModel');
const formidable = require('formidable');
const { article_validator } = require('../../validator/validator')
const { storage } = require('../../firebaseData');
const { getStorage,ref, deleteObject } = require("firebase/storage");

const fs = require('fs');
const articleModel = require('../../models/articleModel');

module.exports.get_tag_category = async (req, res) => {
    try {
        const allTag = await tagModel.find({});
        const allCategory = await categoryModel.find({});
        res.status(200).json({ allCategory, allTag })
    } catch (error) {
        res.status(500).json({
            errorMessage: {
                error: 'Internal server error'
            }
        })
    }
}

module.exports.add_artical = (req, res) => {

    const formDataHendle = formidable({
        multiples: true
    })
    const { adminId, adminName } = req;

    formDataHendle.parse(req, async (err, fields, files) => {
        if (!err) {
            const { title, category, slug, tag, text,imageName,imageUrl } = fields;
            console.log("Image Name in Controller ",imageName);
            console.log("Image URL in Controller ",imageUrl);

            const validate = article_validator(fields, files);
            if (validate.validated) {
                const categoryName = category.split('-').join(' ');
                const tagName = tag.split('-').join(' ');
                // files.image.originalFilename = Date.now() + files.image.originalFilename;

                // const uploadPath = __dirname + `../../../../frontend/public/articalImage/${files.image.originalFilename}`;

                // fs.copyFile(files.image.filepath, uploadPath, async (error) => {
                //     if (error) {
                //         res.status(400).json({
                //             errorMessage: {
                //                 imageUpload: 'Image upload file'
                //             }
                //         })
                //     } else {
                //         try {
                //             await articleModel.create({
                //                 adminId,
                //                 adminName,
                //                 title,
                //                 slug,
                //                 status: 'pending',
                //                 category: categoryName,
                //                 category_slug: category,
                //                 tag: tagName,
                //                 tag_slug: tag,
                //                 articleText: text,
                //                 image: imageUrl
                //             })
                //             res.status(201).json({
                //                 successMessage: 'Article add successfull'
                //             })
                //         } catch (error) {
                //             console.log(error.message)
                //             res.status(500).json({
                //                 errorMessage: {
                //                     error: 'Internal server error'
                //                 }
                //             })
                //         }
                //     }
                // })

                try {
                    await articleModel.create({
                        adminId,
                        adminName,
                        title,
                        slug,
                        status: 'pending',
                        category: categoryName,
                        category_slug: category,
                        tag: tagName,
                        tag_slug: tag,
                        articleText: text,
                        image: imageUrl,
                        imageName:imageName
                    })
                    res.status(201).json({
                        successMessage: 'Article add successfull'
                    })
                } catch (error) {
                    console.log(error.message)
                    res.status(500).json({
                        errorMessage: {
                            error: 'Internal server error'
                        }
                    })
                }
            } else {
                res.status(400).json({ errorMessage: validate.error })
            }
        }
    })
}

module.exports.get_artical = async (req, res) => {
    const { role, adminId } = req;
    const { currentPage, searchValue } = req.query;

    const parPage = 12;

    const skipPage = parseInt(currentPage - 1) * parPage;

    let articals = [];

    try {
        let articleCount = 0;

        if (searchValue) {
            if (role === 'admin') {
                articleCount = await articleModel.find({}).countDocuments();
                articals = await articleModel.find({}).skip(skipPage).limit(parPage).sort({ createAt: -1 });
                articals = articals.filter(ar => ar.title.toUpperCase().indexOf(searchValue.toUpperCase()) > -1);
            } else {
                articleCount = await articleModel.find({ adminId }).countDocuments();
                articals = await articleModel.find({ adminId }).skip(skipPage).limit(parPage).sort({ createAt: -1 });
                articals = articals.filter(ar => ar.title.toUpperCase().indexOf(searchValue.toUpperCase()) > -1);
            }
        } else {
            if (role === 'admin') {
                articleCount = await articleModel.find({}).countDocuments();
                articals = await articleModel.find({}).skip(skipPage).limit(parPage).sort({ createAt: -1 });
            } else {
                articleCount = await articleModel.find({ adminId }).countDocuments();
                articals = await articleModel.find({ adminId }).skip(skipPage).limit(parPage).sort({ createAt: -1 });
            }
        }

        res.status(200).json({
            allArticle: articals,
            parPage,
            articleCount
        })
    } catch (error) {
        res.status(500).json({
            errorMessage: {
                error: 'Internal server error'
            }
        })
    }
}

module.exports.edit_artical = async (req, res) => {

    const { articleSlug } = req.params;
    const { adminId, role } = req;

    try {
        const getArticle = await articleModel.findOne({ slug: articleSlug });
        if (getArticle && getArticle.adminId === adminId || getArticle.role === role) {
            res.status(200).json({ editArticle: getArticle })
        } else {
            res.status(404).json({
                errorMessage: {
                    error: 'You can not edit this article'
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            errorMessage: {
                error: 'Internal server error'
            }
        })
    }
}
module.exports.update_artical = async (req, res) => {
    const { title, category, slug, tag, text, articleId } = req.body;
    const { adminId, role } = req;
    const validate = article_validator(req.body, '');

    if (validate.validated) {
        try {
            const getArticle = await articleModel.findById(articleId);

            if (getArticle && getArticle.adminId === adminId || getArticle.role === role) {
                const categoryName = category.split('-').join(' ');
                const tagName = tag.split('-').join(' ');
                await articleModel.findByIdAndUpdate(articleId, {
                    title: title.trim(),
                    slug: slug.trim(),
                    category: categoryName,
                    category_slug: category,
                    tag: tagName,
                    tag_slug: tag,
                    articleText: text,
                })
                res.status(201).json({
                    successMessage: 'Article edit successfull'
                })

            } else {
                res.status(404).json({
                    errorMessage: {
                        error: 'You can not edit this article'
                    }
                })
            }
        } catch (error) {
            res.status(500).json({
                errorMessage: {
                    error: 'Internal server error'
                }
            })
        }
    } else {
        res.status(400).json({ errorMessage: validate.error })
    }
}

module.exports.delete_artical = async (req, res) => {
    const { articleId } = req.params;
    const { adminId, role } = req;
    try {
        const getArticle = await articleModel.findById(articleId);
        if (getArticle && (getArticle.adminId === adminId || role === 'admin') ) {
            const imageRef = ref(storage, `images/${getArticle.imageName}`);

            await articleModel.findByIdAndDelete(articleId);
            res.status(201).json({
                successMessage: 'Article delete successful'
            })
            await deleteObject(imageRef).then(()=>{
console.log("Succesfull deleted image reference");
            })
            .catch((err)=>{
                console.log("Image in not deleted  from the firebase", err);
            });
            

        } else {
            res.status(404).json({
                errorMessage: {
                    error: 'You can not edit this article'
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            errorMessage: {
                error: 'Internal server error'
            }
        })
    }
}











// const categoryModel = require('../../models/categoryModel');
// const tagModel = require('../../models/tagModel');
// const formidable = require('formidable');
// const { article_validator } = require('../../validator/validator')
// // import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";
// const fs = require('fs');
// const articleModel = require('../../models/articleModel');
// const { getStorage } = require('firebase/storage');
// // const {ref}=require('../../firebaseServer')
// // const {storage} = require('../../firebaseServer/');
// const { app, db, storage, storageRef, ref, uploadBytes, getDownloadURL } = require('../../firebaseServer');

// module.exports.get_tag_category = async (req, res) => {
//     try {
//         const allTag = await tagModel.find({});
//         const allCategory = await categoryModel.find({});
//         res.status(200).json({ allCategory, allTag })
//     } catch (error) {
//         res.status(500).json({
//             errorMessage: {
//                 error: 'Internal server error'
//             }
//         })
//     }
// }

// module.exports.add_artical = (req, res) => {

//     const formDataHendle = formidable({
//         multiples: true
//     })
//     const { adminId, adminName } = req;

//     formDataHendle.parse(req, async (err, fields, files) => {
//         if (!err) {
//             const { title, category, slug, tag, text } = fields;
//             const validate = article_validator(fields, files);
//             if (validate.validated) {
//                 const categoryName = category.split('-').join(' ');
//                 const tagName = tag.split('-').join(' ');
//                 files.image.originalFilename = Date.now() + files.image.originalFilename;

//                 // const uploadPath = __dirname + `../../../../frontend/public/articalImage/${files.image.originalFilename}`;
//                 const uploadPath = `articalImage/${files.image.originalFilename}`;

//                 const storageRef = ref(storage, uploadPath);
//                 await uploadBytes(storageRef, fs.createReadStream(files.image.path));
//                 const imageUrl = await getDownloadURL(storageRef);

//                 // Save imageUrl along with other article details in MongoDB
//                 await articleModel.create({
//                     adminId,
//                     adminName,
//                     title,
//                     slug,
//                     status: 'pending',
//                     category: categoryName,
//                     category_slug: category,
//                     tag: tagName,
//                     tag_slug: tag,
//                     articleText: text,
//                     image: imageUrl
//                 });

//                 // fs.copyFile(files.image.filepath, uploadPath, async (error) => {
//                 //     if (error) {
//                 //         res.status(400).json({
//                 //             errorMessage: {
//                 //                 imageUpload: 'Image upload file'
//                 //             }
//                 //         })
//                 //     } else {
//                 //         try {
//                 //             await articleModel.create({
//                 //                 adminId,
//                 //                 adminName,
//                 //                 title,
//                 //                 slug,
//                 //                 status: 'pending',
//                 //                 category: categoryName,
//                 //                 category_slug: category,
//                 //                 tag: tagName,
//                 //                 tag_slug: tag,
//                 //                 articleText: text,
//                 //                 image: files.image.originalFilename
//                 //             })
//                 //             res.status(201).json({
//                 //                 successMessage: 'Article add successfull'
//                 //             })
//                 //         } catch (error) {
//                 //             console.log(error.message)
//                 //             res.status(500).json({
//                 //                 errorMessage: {
//                 //                     error: 'Internal server error'
//                 //                 }
//                 //             })
//                 //         }
//                 //     }
//                 // })
//             } else {
//                 res.status(400).json({ errorMessage: validate.error })
//             }
//         }
//     })
// }

// module.exports.get_artical = async (req, res) => {
//     const { role, adminId } = req;
//     const { currentPage, searchValue } = req.query;

//     const parPage = 12;

//     const skipPage = parseInt(currentPage - 1) * parPage;

//     let articals = [];

//     try {
//         let articleCount = 0;

//         if (searchValue) {
//             if (role === 'admin') {
//                 articleCount = await articleModel.find({}).countDocuments();
//                 articals = await articleModel.find({}).skip(skipPage).limit(parPage).sort({ createAt: -1 });
//                 articals = articals.filter(ar => ar.title.toUpperCase().indexOf(searchValue.toUpperCase()) > -1);
//             } else {
//                 articleCount = await articleModel.find({ adminId }).countDocuments();
//                 articals = await articleModel.find({ adminId }).skip(skipPage).limit(parPage).sort({ createAt: -1 });
//                 articals = articals.filter(ar => ar.title.toUpperCase().indexOf(searchValue.toUpperCase()) > -1);
//             }
//         } else {
//             if (role === 'admin') {
//                 articleCount = await articleModel.find({}).countDocuments();
//                 articals = await articleModel.find({}).skip(skipPage).limit(parPage).sort({ createAt: -1 });
//             } else {
//                 articleCount = await articleModel.find({ adminId }).countDocuments();
//                 articals = await articleModel.find({ adminId }).skip(skipPage).limit(parPage).sort({ createAt: -1 });
//             }
//         }

//         res.status(200).json({
//             allArticle: articals,
//             parPage,
//             articleCount
//         })
//     } catch (error) {
//         res.status(500).json({
//             errorMessage: {
//                 error: 'Internal server error'
//             }
//         })
//     }
// }

// module.exports.edit_artical = async (req, res) => {

//     const { articleSlug } = req.params;
//     const { adminId, role } = req;

//     try {
//         const getArticle = await articleModel.findOne({ slug: articleSlug });
//         if (getArticle && getArticle.adminId === adminId || getArticle.role === role) {
//             res.status(200).json({ editArticle: getArticle })
//         } else {
//             res.status(404).json({
//                 errorMessage: {
//                     error: 'You can not edit this article'
//                 }
//             })
//         }
//     } catch (error) {
//         res.status(500).json({
//             errorMessage: {
//                 error: 'Internal server error'
//             }
//         })
//     }
// }
// module.exports.update_artical = async (req, res) => {
//     const { title, category, slug, tag, text, articleId } = req.body;
//     const { adminId, role } = req;
//     const validate = article_validator(req.body, '');

//     if (validate.validated) {
//         try {
//             const getArticle = await articleModel.findById(articleId);

//             if (getArticle && getArticle.adminId === adminId || getArticle.role === role) {
//                 const categoryName = category.split('-').join(' ');
//                 const tagName = tag.split('-').join(' ');
//                 await articleModel.findByIdAndUpdate(articleId, {
//                     title: title.trim(),
//                     slug: slug.trim(),
//                     category: categoryName,
//                     category_slug: category,
//                     tag: tagName,
//                     tag_slug: tag,
//                     articleText: text,
//                 })
//                 res.status(201).json({
//                     successMessage: 'Article edit successfull'
//                 })

//             } else {
//                 res.status(404).json({
//                     errorMessage: {
//                         error: 'You can not edit this article'
//                     }
//                 })
//             }
//         } catch (error) {
//             res.status(500).json({
//                 errorMessage: {
//                     error: 'Internal server error'
//                 }
//             })
//         }
//     } else {
//         res.status(400).json({ errorMessage: validate.error })
//     }
// }

// module.exports.delete_artical = async (req, res) => {
//     const { articleId } = req.params;
//     const { adminId, role } = req;
//     try {
//         const getArticle = await articleModel.findById(articleId);
//         // && getArticle.adminId === adminId || getArticle.role === role
//         if (getArticle && (getArticle.adminId === adminId || role === 'admin') ) {
//             await articleModel.findByIdAndDelete(articleId);
//             res.status(201).json({
//                 successMessage: 'Article delete successfull'
//             })

//         } else {
//             res.status(404).json({
//                 errorMessage: {
//                     error: 'You can not edit this article'
//                 }
//             })
//         }
//     } catch (error) {
//         res.status(500).json({
//             errorMessage: {
//                 error: 'Internal server error'
//             }
//         })
//     }
// }