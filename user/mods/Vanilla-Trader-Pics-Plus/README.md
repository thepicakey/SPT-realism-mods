# Alternative Trader Pictures
Updates Trader icons to a much better looking alternative.
<br></br>

## Description
Replaces the server method that displays the trader icons with a custom method that uses custom image files for the trader icons. These can be changed out to any icons(images) desired provided you follow the steps to ensure that they all match filetypes and are of equal or very similar size.


## Installation
^^^ PRIMARY INSTALLATION INSTRUCTIONS
  1. Extract the contents of the zip file into the root of your SPT folder. It will automatically place the file into your mods folder.
  2. This mod should be loaded after all other mods that add new traders.
  3. If you suspect that this mod is loading before an additional trader is loaded, the load order may need to be changed by adding an additional "Z" or more to the folder name.
  4. After altering the name, delete BSG temp files using the settings menu in the Aki.Launcher.exe program.
<br></br>

## Changing Images
You can customize it too! You can replace the traders with whatever pictures you like.

Follow these guidelines to make sure the new pictures fit the item frames within the game.
  * Recommend square pictures but round can also be used.
  * Transparency is ok.
  * Recommended photo size = 512x for best compatibility.
    * Pictures can be larger (1024x, 2048, etc.), but it requires more memory to store the larger file sizes while the game is running. Do so at your own risk.
    * It can take longer for the game to load the images if there are a lot of large file sizes.
  * Recommended filetypes = jpg or png (pick one; default is jpg).
  * Do not use both jpg and png at the same time. Only one filetype can be used at any time.

**EXAMPLE: PRAPOR --> ./RES/59B91CA086F77469A81232E4.JPG (IMAGE SIZE 512X512)**
  * If you would like to replace this picture, rename the picture of your choosing to include the same string "59b91ca086f77469a81232e4" and copy it to the mod/res folder.
  * If a file of the same name exists, click on "Yes" or "OK" to overwrite it.
  * To change to png from jpg, and vice versa, you will need to edit the ./src/config.js file.
  * See the configuration file options listed below for where to change the file extension type.
<br></br>

## Configuration Options
You can specify which images you want to change and leave the rest as their defaults. Default is to change all supported trader images (default traders and mod traders). To change this, set the line '**updateAllTraders**' to *false* and then enable or disable the trader(s) of your choice in the options below by setting them to *true*. '**updateAllTraders**' will override other options when set to *true*.
```json
{
    "----- File Extension 1 ": "Sets the extension of the image files",
    "----- File Extension 2 ": "Only one supported extension at a time.",
    "extension": "jpg",

    "----- Update All Traders 1 ": "Update all supported traders (default and mods)",
    "----- Update All Traders 2 ": "This will override the remaining options in this config",
        "updateAllTraders": true,

    "----- Update Only Selected Traders 1": "Choose which traders you want to update",
    "----- Update Only Selected Traders 2": "The setting 'updateAllTraders' must be set to false for these options to work",
        "DEFAULT TRADERS": "-------------------------",
            "updatePrapor": false,
            "updateTherapist": false,
            "updateFence": false,
            "updateSkier": false,
            "updatePeacekeeper": false,
            "updateMechanic": false,
            "updateRagman": false,
            "updateJaeger": false,
            "updateLightKeeper": false,
        "MOD TRADERS": "-------------------------",
            "AIOTrader": false,
            "AKGuy": false,
            "AnastasiaSvetlana": false,
            "ARSHoppe": false,
            "Bootlegger": false,
            "DRIP": false,
            "GearGal": false,
            "GoblinKing": false,
            "Gunsmith": false,
            "IProject": false,
            "KatarinaBlack": false,
            "KeyMaster": false,
            "MFACShop": false,
            "Priscilu": false,
            "Questor": false,
            "TheBroker": false
}
```
<br></br>

## Accreditation
revingly - Optimized code for faster and more precise loading of the mod.


<br></br>
<br></br>
:eof