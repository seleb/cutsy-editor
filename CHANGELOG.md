# [1.4.0](https://github.com/seleb/cutsy-editor/compare/v1.3.3...v1.4.0) (2024-11-27)


### Features

* app prompts confirmation when quitting mid-export ([d5df8fe](https://github.com/seleb/cutsy-editor/commit/d5df8fec1d2fb9c6531f497e0db5f4d2dc1f318a))

## [1.3.3](https://github.com/seleb/cutsy-editor/compare/v1.3.2...v1.3.3) (2024-08-04)


### Bug Fixes

* **build:** cargo update ([369be3c](https://github.com/seleb/cutsy-editor/commit/369be3c7a66148a0a224ed90b88e7df981068581))

## [1.3.2](https://github.com/seleb/cutsy-editor/compare/v1.3.1...v1.3.2) (2024-08-04)


### Bug Fixes

* **build:** try downgrading mac runner ([6d55ba3](https://github.com/seleb/cutsy-editor/commit/6d55ba3d8370193554fcde77f087c756b446bd5b))

## [1.3.1](https://github.com/seleb/cutsy-editor/compare/v1.3.0...v1.3.1) (2024-08-04)


### Bug Fixes

* **build:** update `tauri-build` ([4d85295](https://github.com/seleb/cutsy-editor/commit/4d85295f6eff7668c178b17a9f0f9ab8b788da89))

# [1.3.0](https://github.com/seleb/cutsy-editor/compare/v1.2.1...v1.3.0) (2024-08-04)


### Bug Fixes

* flicker on seek to clip start ([e27e440](https://github.com/seleb/cutsy-editor/commit/e27e4403f4140d7d67028e076dac7e63d26f0d15))


### Features

* `[`/`]` hotkeys for jump to clip start/end ([63cc0e5](https://github.com/seleb/cutsy-editor/commit/63cc0e569d971e484deb688b615dcd2b9fd3ebce))
* add custom css setting ([a2784d5](https://github.com/seleb/cutsy-editor/commit/a2784d51ef1b17a1855910f734a9dd1243daf1a9))
* ctrl + space restarts clip ([04ea392](https://github.com/seleb/cutsy-editor/commit/04ea39251c9d54d7b1db106d394d0a93c686e6ab))
* setting for showing clips in folder after saving ([549ba55](https://github.com/seleb/cutsy-editor/commit/549ba55a0144809d4e392a2054aba3991b7d2324))

## [1.2.1](https://github.com/seleb/cutsy-editor/compare/v1.2.0...v1.2.1) (2023-08-12)


### Bug Fixes

* malformed URI when opening some files ([baf6b23](https://github.com/seleb/cutsy-editor/commit/baf6b234faba5a6b751d6ec5d1e8e14fdeac32bd))

# [1.2.0](https://github.com/seleb/cutsy-editor/compare/v1.1.2...v1.2.0) (2023-07-11)


### Features

* add setting for selecting video folders ([8cdd83c](https://github.com/seleb/cutsy-editor/commit/8cdd83c49546f094ab8b71d5ea2e4517b3151c4e))

## [1.1.2](https://github.com/seleb/cutsy-editor/compare/v1.1.1...v1.1.2) (2023-06-12)


### Bug Fixes

* simplify hotkey regex ([b06aef8](https://github.com/seleb/cutsy-editor/commit/b06aef80b88bf41f39edf8bc406c4fa80a292ec0))
* unnecessary refreshing when there are no videos ([8401e16](https://github.com/seleb/cutsy-editor/commit/8401e1692027ca0dfe24e63868565e77ec32c24f))

## [1.1.1](https://github.com/seleb/cutsy-editor/compare/v1.1.0...v1.1.1) (2023-06-02)


### Bug Fixes

* crop build error ([6e6e6d9](https://github.com/seleb/cutsy-editor/commit/6e6e6d9e4e3a40e1d3f96e49e8bd1f5989543ff0))

# [1.1.0](https://github.com/seleb/cutsy-editor/compare/v1.0.2...v1.1.0) (2023-06-02)


### Features

* add "date modified" sort ([46c6927](https://github.com/seleb/cutsy-editor/commit/46c69276869c70869954d0be52a789fc1ddb40ad))
* add "size" sort + separate sort method/direction ([93f3bf0](https://github.com/seleb/cutsy-editor/commit/93f3bf0c98f805c02c41fa5629b6ef02f368246a))
* add crop instruction to help menu ([e5b300d](https://github.com/seleb/cutsy-editor/commit/e5b300d889890965714a5182401b8d438cf6f104))
* add cropping to video editor view ([bd56f3e](https://github.com/seleb/cutsy-editor/commit/bd56f3e7ad6fb134007b53fd4ea5618b806985ff))
* arrow keys skip based on zoom level ([e6637d2](https://github.com/seleb/cutsy-editor/commit/e6637d22ce4565ee42e8c170171194f075476930))
* improve UI on videos view ([28567a4](https://github.com/seleb/cutsy-editor/commit/28567a4d3304c4e99735dd27921efe10abae9286))
* persist sort method + direction ([2b9f13f](https://github.com/seleb/cutsy-editor/commit/2b9f13fc2b374f767089c85f82d0587b58972127))
* version number in settings links to releases with changelog ([43b2cbb](https://github.com/seleb/cutsy-editor/commit/43b2cbb7d6da36b69ddfcbd03e1c862ec46d6c12))

## [1.0.2](https://github.com/seleb/cutsy-editor/compare/v1.0.1...v1.0.2) (2023-05-16)


### Bug Fixes

* better error handling on checking + installing ffmpeg ([4aa07e7](https://github.com/seleb/cutsy-editor/commit/4aa07e714a5484ca5f50742f483c5f082cc6f111))
* better error handling on ffmpeg calls ([e1dd361](https://github.com/seleb/cutsy-editor/commit/e1dd3610f0220df2668cb58cf2d3669bccda1a2b))
* ffmpeg installation is checked outside main thread ([e65ed15](https://github.com/seleb/cutsy-editor/commit/e65ed152c9eb4f59b8a5544b64c4081d47fe99ac))
* slightly better `GateFfmpeg` error display ([217b7e7](https://github.com/seleb/cutsy-editor/commit/217b7e71814609f7762a07db710be01acc646297))

## [1.0.1](https://github.com/seleb/cutsy-editor/compare/v1.0.0...v1.0.1) (2023-05-15)


### Bug Fixes

* crash on ffmpeg install failure ([32a46f8](https://github.com/seleb/cutsy-editor/commit/32a46f8c7342de50e1ab95d1666788c598aee7c1))
* missing window title ([e8dc476](https://github.com/seleb/cutsy-editor/commit/e8dc476f74a4a401194f85c0f977e5a110b3ac75))
* redundant window title ([4568d3a](https://github.com/seleb/cutsy-editor/commit/4568d3ab04c7e594824a32648f30897a176be308))

# 1.0.0 (2023-05-15)


### Features

* initial release ([4622c3a](https://github.com/seleb/cutsy-editor/commit/4622c3a64a2ab7ab949644a528a46171776919b6))
