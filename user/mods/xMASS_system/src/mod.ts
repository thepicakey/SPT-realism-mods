import { DependencyContainer }      from "tsyringe";
import { IPostDBLoadMod }           from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer }           from "@spt-aki/servers/DatabaseServer";
import { ImporterUtil }             from "@spt-aki/utils/ImporterUtil";
import { ILogger }                  from "@spt-aki/models/spt/utils/ILogger";
import { PreAkiModLoader }          from "@spt-aki/loaders/PreAkiModLoader";
import { IDatabaseTables }          from "@spt-aki/models/spt/server/IDatabaseTables";
import { JsonUtil }                 from "@spt-aki/utils/JsonUtil"
import { ITemplateItem, Slot }      from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { ICustomizationItem }       from "@spt-aki/models/eft/common/tables/ICustomizationItem";
import { ImmFACDatabase }           from "@spt-aki/mmFAC/ImmFACDatabase";
import { ImmFACItem, ImmFACLocale } from "@spt-aki/mmFAC/ImmFACItem";
import { ImmFACCustomizationItem }  from "@spt-aki/mmFAC/ImmFACCustomizationItem";
import { ItemFilterService }        from "@spt-aki/services/ItemFilterService";
import { ConfigTypes }              from "@spt-aki/models/enums/ConfigTypes";
import { ConfigServer }             from "@spt-aki/servers/ConfigServer";


//MCv008_withblacklist
//Config file
import modConfig = require("../config.json");
//Blacklist file
import blacklist = require("../blacklist.json");


//Item template file
import itemTemplate =       require("../templates/item_template.json");
import articleTemplate =    require("../templates/article_template.json");


class AddItems implements IPostDBLoadMod
{
    private db:         IDatabaseTables;
    private mydb:       ImmFACDatabase;    
    private logger:     ILogger;
    private jsonUtil:   JsonUtil;

    public postDBLoad(container: DependencyContainer): void
    {
        this.logger =               container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil =             container.resolve<JsonUtil>("JsonUtil");

        const databaseServer =      container.resolve<DatabaseServer>("DatabaseServer");
        const databaseImporter =    container.resolve<ImporterUtil>("ImporterUtil");
        const modLoader =           container.resolve<PreAkiModLoader>("PreAkiModLoader");

        //Mod Info
        const modFolderName =   "xMASS_system";
        const modFullName =     "Modular Attachments Server Side Shooter System";

        //Trader IDs
        const traders = {
            "Mechanic" : "5a7c2eca46aef81a7ca2145d"
        };

        //Currency IDs
        const currencies = {
            "roubles":  "5449016a4bdc2d6f028b456f",
            "dollars":  "5696686a4bdc2da3298b456a",
            "euros":    "569668774bdc2da2298b4568"
        }

        //Get the server database and our custom database
        this.db =   databaseServer.getTables();
        this.mydb = databaseImporter.loadRecursive(`${modLoader.getModPath(modFolderName)}database/`);

        this.logger.info("Loading: " + modFullName);

        //Start by checking the items and clothing jsons for errors
        //NOT IMPLEMENTED YET
        //this.checkJSON(this.mydb.mmfac_items);
        //this.checkJSON(this.mydb.mmfac_clothes);

        //Blacklist Function
        const configServer =        container.resolve<ConfigServer>("ConfigServer");
        const serverScavcaseConfig = configServer.getConfig(ConfigTypes.SCAVCASE);
        const itemFilterService = container.resolve<ItemFilterService>("ItemFilterService");
        const itemBlacklist = itemFilterService.getBlacklistedItems();
        itemBlacklist.push(...blacklist.addtoconfigsitem.blacklist);


        const newBlacklist2 = serverScavcaseConfig.rewardItemBlacklist.concat(blacklist.addtoconfigsscavcase.rewardItemBlacklist);

        serverScavcaseConfig.rewardItemBlacklist = newBlacklist2;
        ///this.logger.info(serverScavcaseConfig.rewardItemBlacklist);


        //Items
        for (const [mmFACID, mmFACItem] of Object.entries(this.mydb.mmfac_items))
        {
            if ( mmFACItem.enable )
            {
                const sptID = mmFACItem.sptID;

                //Items + Handbook
                if ( "clone" in mmFACItem )
                {
                    this.cloneItem(mmFACItem.clone, mmFACID, sptID);
                    this.copyToFilters(mmFACItem.clone, mmFACID, sptID, mmFACItem.enableCloneCompats, mmFACItem.enableCloneConflicts);
                }
                else this.createItem(mmFACID, sptID);

                //Locales (Languages)
                this.addLocales(mmFACID, sptID, mmFACItem);

                //Trades
                //this.addTrades(mmFACID, mmFACItem, traders, currencies);
            }
        }
        this.logger.debug(modFolderName + " items and handbook finished");
        
        //Item Filters
        for (const [mmFACID, mmFACItem] of Object.entries(this.mydb.mmfac_items))
        {
            const sptID = mmFACItem.sptID;
            if ( this.mydb.mmfac_items[mmFACID].enable ) this.addToFilters(mmFACID, sptID);
        }
        this.logger.debug(modFolderName + " item filters finished");

        //Clothing
        for (const [mmFACID, mmFACArticle] of Object.entries(this.mydb.mmfac_clothes))
        {
            const sptID = mmFACArticle.sptID;

            //Articles + Handbook
            if ( "clone" in mmFACArticle )
            {
                this.cloneClothing(mmFACArticle.clone, mmFACID, sptID);
            }
            else
            {
                //Doesn't do anything yet...
                this.createClothing(mmFACID, sptID);
            }

            //Locales (Languages)
            this.addLocales(mmFACID, sptID, undefined, mmFACArticle);

            //Trades
            //this.addTrades(mmFACID, mmFACItem, traders, currencies);
        }
        this.logger.debug(modFolderName + " clothing finished");

        //Presets
        for (const preset in this.mydb.globals.ItemPresets) this.db.globals.ItemPresets[preset] = this.mydb.globals.ItemPresets[preset];
        this.logger.debug(modFolderName + " presets finished");

        //Traders
        for (const trader in traders)
        {
            this.addTraderAssort(traders[trader]);
            this.addTraderSuits(traders[trader]);
        }
        this.logger.debug(modFolderName + " traders finished");

        //Stimulator Buffs
        //for (const buff in this.mydb.globals.config.Health.Effects.Stimulator.Buffs) this.db.globals.config.Health.Effects.Stimulator.Buffs[buff] = this.mydb.globals.config.Health.Effects.Stimulator.Buffs[buff];
        //this.logger.debug(modFolderName + " stimulator buffs finished");

        //Mastery
        const dbMastering = this.db.globals.config.Mastering
        for (const weapon in this.mydb.globals.config.Mastering) dbMastering.push(this.mydb.globals.config.Mastering[weapon]);
        for (const weapon in dbMastering) 
        {

        }
        this.logger.debug(modFolderName + " mastery finished");
    }

    private cloneItem(itemToClone: string, mmFACID: string, sptID: string): void
    {
        //Clone an item by its ID from the SPT items.json

        //Get a clone of the original item from the database
        let mmFACItemOut =  this.jsonUtil.clone(this.db.templates.items[itemToClone]);

        //Change the necessary item attributes using the info in our database file mmfac_items.json
        mmFACItemOut._id = sptID;
        mmFACItemOut = this.compareAndReplace(mmFACItemOut, this.mydb.mmfac_items[mmFACID]["item"]);

        //Add the new item to the database
        this.db.templates.items[sptID] = mmFACItemOut;
        this.logger.debug("Item \"" + mmFACID + "\" created as a clone of " + itemToClone + " and added to database.");

        //Create the handbook entry for the items
        const handbookEntry = {
            "Id": sptID,
            "ParentId": this.mydb.mmfac_items[mmFACID]["handbook"]["ParentId"],
            "Price": this.mydb.mmfac_items[mmFACID]["handbook"]["Price"]
        };

        //Add the handbook entry to the database
        this.db.templates.handbook.Items.push(handbookEntry);
        this.logger.debug("Item \"" + mmFACID + "\" added to handbook with price " + handbookEntry.Price);
    }

    private createItem(itemToCreate: string, sptID: string): void
    {
        //Create an item from scratch instead of cloning it
        //Requires properly formatted entry in mmfac_items.json with NO "clone" attribute

        //Get the new item object from the json
        const newItem = this.mydb.mmfac_items[itemToCreate];

        //Check the structure of the new item in mmfac_items
        const [pass, checkedItem] = this.checkItem(newItem);
        if ( !pass ) return;

        //Add the new item to the database
        this.db.templates.items[sptID] = checkedItem;
        this.logger.debug("Item \"" + itemToCreate + "\" created and added to database.");

        //Create the handbook entry for the items
        const handbookEntry = {
            "Id": sptID,
            "ParentId": newItem["handbook"]["ParentId"],
            "Price": newItem["handbook"]["Price"]
        };

        //Add the handbook entry to the database
        this.db.templates.handbook.Items.push(handbookEntry);
        this.logger.debug("Item \"" + itemToCreate + "\" added to handbook with price " + handbookEntry.Price);
    }

    private checkItem(itemToCheck: ImmFACItem): [boolean, ITemplateItem]
    {
        //A very basic top-level check of an item to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors

        let pass = true;

        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in itemTemplate )
        {
            if ( !(level1 in itemToCheck.item) )
            {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your item entry!");
                pass = false;
            }
        }

        //Then make sure the attributes in _props exist in the item template, warn user if not.
        for (const prop in itemToCheck.item._props)
        {
            if ( !(prop in itemTemplate._props) ) this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in item template!");
        }

        const itemOUT: ITemplateItem = {
            "_id":      itemToCheck.item._id,
            "_name":    itemToCheck.item._name,
            "_parent":  itemToCheck.item._parent,
            "_props":   itemToCheck.item._props,
            "_type":    itemToCheck.item._type,
            "_proto":   itemToCheck.item._proto
        };

        return [pass, itemOUT];
    }

    private compareAndReplace(originalItem, attributesToChange)
    {
        //Recursive function to find attributes in the original item/clothing object and change them.
        //This is done so each attribute does not have to be manually changed and can instead be read from properly formatted json
        //Requires the attributes to be in the same nested object format as the item entry in order to work (see mmfac_items.json and items.json in SPT install)

        for (const key in attributesToChange)
        {
            //If you've reached the end of a nested series, try to change the value in original to new
            if ( (["boolean", "string", "number"].includes(typeof attributesToChange[key])) || Array.isArray(attributesToChange[key]) )
            {
                if ( key in originalItem ) originalItem[key] = attributesToChange[key];
                //TO DO: Add check with item template here if someone wants to add new properties to a cloned item.
                else 
                {
                    this.logger.warning("(Item: " + originalItem._id + ") WARNING: Could not find the attribute: \"" + key + "\" in the original item, make sure this is intended!");
                    originalItem[key] = attributesToChange[key];
                }
            }

            //Otherwise keep traveling down the nest
            else originalItem[key] = this.compareAndReplace(originalItem[key], attributesToChange[key]);
        }

        return originalItem;
    }

    private getFilters(item: string): [Array<Slot>, Array<string>]
    {
        //Get the slots, chambers, cartridges, and conflicting items objects and return them.

        const slots = (typeof this.db.templates.items[item]._props.Slots === "undefined")            ? [] : this.db.templates.items[item]._props.Slots;
        const chambers = (typeof this.db.templates.items[item]._props.Chambers === "undefined")      ? [] : this.db.templates.items[item]._props.Chambers;
        const cartridges = (typeof this.db.templates.items[item]._props.Cartridges === "undefined")  ? [] : this.db.templates.items[item]._props.Cartridges;
        const filters = slots.concat(chambers, cartridges);

        const conflictingItems =  (typeof this.db.templates.items[item]._props.ConflictingItems === "undefined") ? [] : this.db.templates.items[item]._props.ConflictingItems;

        return [filters, conflictingItems];
    }

    private copyToFilters(itemClone: string, mmFACID: string, sptID: string, enableCompats = true, enableConflicts = true): void
    {
        //Find the original item in all compatible and conflict filters and add the clone to those filters as well
        //Will skip one or both depending on the enable parameters found in mmfac_items.json (default is true)

        //Get a list of all our custom items so we can skip over them:
        const sptIDs: string[] = [];
        for (const mmFACItem of Object.values(this.mydb.mmfac_items)) sptIDs.push(mmFACItem.sptID)

        for (const item in this.db.templates.items)
        {
            if ( item in sptIDs ) continue;
            
            const [filters, conflictingItems] = this.getFilters(item);

            if ( enableCompats )
            {
                for (const filter of filters)
                {
                    for (const id of filter._props.filters[0].Filter)
                    {
                        if ( id === itemClone ) filter._props.filters[0].Filter.push(sptID);
                    }
                }
            }

            if ( enableConflicts ) for (const conflictID of conflictingItems) if ( conflictID === itemClone ) conflictingItems.push(sptID);
        }
    }

    private addToFilters(mmFACID: string, sptID: string): void
    {
        //Add a new item to compatibility & conflict filters of pre-existing items
        //Add additional compatible and conflicting items to new item filters (manually adding more than the ones that were cloned)

        const mmFACNewItem =    this.mydb.mmfac_items[mmFACID];

        this.logger.debug("addToFilters: " + mmFACID);

        //Manually add items into an mmFAC item's filters
        if ( "addToThisItemsFilters" in mmFACNewItem )
        {
            const   mmFACItemFilters =      this.getFilters(sptID)[0];
            let     mmFACConflictingItems = this.getFilters(sptID)[1];

            for (const modSlotName in mmFACNewItem.addToThisItemsFilters)
            {
                if ( modSlotName === "conflicts" ) mmFACConflictingItems = mmFACConflictingItems.concat(mmFACNewItem.addToThisItemsFilters.conflicts)
                else
                {
                    for (const filter in mmFACItemFilters)
                    {
                        if ( modSlotName === mmFACItemFilters[filter]._name )
                        {
                            const slotFilter = mmFACItemFilters[filter]._props.filters[0].Filter;
                            const newFilter = slotFilter.concat(mmFACNewItem.addToThisItemsFilters[modSlotName])

                            mmFACItemFilters[filter]._props.filters[0].Filter = newFilter;
                        }
                    }
                }
            }
        }

        //Manually add mmFAC items to pre-existing item filters.
        if ( "addToExistingItemFilters" in mmFACNewItem )
        {
            for (const modSlotName in mmFACNewItem.addToExistingItemFilters)
            {
                if ( modSlotName === "conflicts" )
                {
                    for (const conflictingItem of mmFACNewItem.addToExistingItemFilters[modSlotName])
                    {
                        const conflictingItems = this.getFilters(conflictingItem)[1];
                        conflictingItems.push(sptID);
                    }
                }
                else
                {
                    for (const compatibleItem of mmFACNewItem.addToExistingItemFilters[modSlotName])
                    {
                        const filters = this.getFilters(compatibleItem)[0];
    
                        for (const filter of filters)
                        {
                            if ( modSlotName === filter._name ) filter._props.filters[0].Filter.push(sptID);
                        }
                    }
                }
            }
        }
    }

    private cloneClothing(articleToClone: string, mmFACID: string, sptID: string): void
    {
        if ( this.mydb.mmfac_clothes[mmFACID].enable || !("enable" in this.mydb.mmfac_clothes[mmFACID]) )
        {
            //Get a clone of the original item from the database
            let mmFACClothingOut = this.jsonUtil.clone(this.db.templates.customization[articleToClone]);

            //Change the necessary clothing item attributes using the info in our database file mmfac_clothes.json
            mmFACClothingOut._id = sptID;
            mmFACClothingOut._name = sptID;
            mmFACClothingOut = this.compareAndReplace(mmFACClothingOut, this.mydb.mmfac_clothes[mmFACID]["customization"]);

            //Add the new item to the database
            this.db.templates.customization[sptID] = mmFACClothingOut;
            this.logger.debug("Clothing item \"" + mmFACID + "\" created as a clone of " + articleToClone + " and added to database.");
        }
    }

    private createClothing(articleToCreate: string, sptID: string): void
    {
        //Create clothing from scratch instead of cloning it
        //Requires properly formatted entry in mmfac_clothes.json with NO "clone" attribute

        //Get the new article object from the json
        const newArticle = this.mydb.mmfac_clothes[articleToCreate];

        //If the article is enabled in the json
        if ( newArticle.enable )
        {
            //Check the structure of the new article in mmfac_clothes
            const [pass, checkedArticle] = this.checkArticle(newArticle);
            if ( !pass ) return;

            //Add the new item to the database
            this.db.templates.customization[sptID] = checkedArticle;
            this.logger.debug("Article " + articleToCreate + " created and added to database.");
        }

    }

    private checkArticle(articleToCheck: ImmFACCustomizationItem): [boolean, ICustomizationItem]
    {
        //A very basic top-level check of an article to make sure it has the proper attributes
        //Also convert to ITemplateItem to avoid errors

        let pass = true;

        //First make sure it has the top-level 5 entries needed for an item
        for (const level1 in articleTemplate )
        {
            if ( !(level1 in articleToCheck.customization) )
            {
                this.logger.error("ERROR - Missing attribute: \"" + level1 + "\" in your article entry!");
                pass = false;
            }
        }

        //Then make sure the attributes in _props exist in the article template, warn user if not.
        for (const prop in articleToCheck.customization._props)
        {
            if ( !(prop in articleTemplate._props) ) this.logger.warning("WARNING - Attribute: \"" + prop + "\" not found in article template!");
        }

        const articleOUT: ICustomizationItem = {
            "_id":      articleToCheck.customization._id,
            "_name":    articleToCheck.customization._name,
            "_parent":  articleToCheck.customization._parent,
            "_props":   articleToCheck.customization._props,
            "_type":    articleToCheck.customization._type,
            "_proto":   articleToCheck.customization._proto
        };

        return [pass, articleOUT];
    }

    private addTraderAssort(trader: string): void 
    {
        //Items
        for (const item in this.mydb.traders[trader].assort.items) 
        {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.items.push(this.mydb.traders[trader].assort.items[item]);
        }

        //Barter Scheme
        for (const item in this.mydb.traders[trader].assort.barter_scheme) 
        {
            //this.logger.debug(item + " added to " + trader);
            this.db.traders[trader].assort.barter_scheme[item] = this.mydb.traders[trader].assort.barter_scheme[item];
        }

        //Loyalty Levels
        for (const item in this.mydb.traders[trader].assort.loyal_level_items) 
        {
            //this.logger.debug(item + " added to " + trader);
            if (modConfig.lvl1Traders) this.db.traders[trader].assort.loyal_level_items[item] = 1;
            else this.db.traders[trader].assort.loyal_level_items[item] = this.mydb.traders[trader].assort.loyal_level_items[item];
        }
    }

    private addTraderSuits(trader: string): void
    {
        //Only do anything if a suits.json file is included for trader in this mod
        if ( typeof this.mydb.traders[trader].suits !== "undefined" )
        {
            //Enable customization for that trader
            this.db.traders[trader].base.customization_seller = true;

            //Create the suits array if it doesn't already exist in SPT database so we can push to it
            if ( typeof this.db.traders[trader].suits === "undefined" ) this.db.traders[trader].suits = [];

            //Push all suits
            for (const suit of this.mydb.traders[trader].suits) this.db.traders[trader].suits.push(suit);
        }
    }

    /*
    private addTrades(mmFACID: string, mmFACItem: ImmFACItem, traders: object, currencies: object): void
    {

        for (const [tradeID, trade] of Object.entries(mmFACItem.trades))
        {

        }
        
        const items = {
            "_id": "",
            "_tpl": "", 
            "parentId": "",
            "slotId": "",
            "upd": {}
        };

        const barter_scheme = {

        };

        const loyal_level_items = {

        }
    }
    */

    private addLocales(mmFACID: string, sptID: string, mmFACItem?: ImmFACItem, mmFACArticle?: ImmFACCustomizationItem): void
    {
        const name =            sptID + " Name";
        const shortname =       sptID + " ShortName";
        const description =     sptID + " Description";

        const isItem = typeof mmFACItem !== "undefined"
        const mmFACEntry = isItem ? mmFACItem : mmFACArticle;

        for (const localeID in this.db.locales.global) //For each possible locale/language in SPT's database
        {
            let localeEntry: ImmFACLocale;

            if ( mmFACEntry.locales )
            {
                if ( localeID in mmFACEntry.locales) //If the language is entered in mmfac_items, use that
                {
                    localeEntry = {
                        "Name":           mmFACEntry.locales[localeID].Name,
                        "ShortName":      mmFACEntry.locales[localeID].ShortName,
                        "Description":    mmFACEntry.locales[localeID].Description
                    }
                }

                else //Otherwise use english as the default
                {
                    localeEntry = {
                        "Name":           mmFACEntry.locales.en.Name,
                        "ShortName":      mmFACEntry.locales.en.ShortName,
                        "Description":    mmFACEntry.locales.en.Description
                    }
                }

                //If you are using the old locales
                if (modConfig.oldLocales) this.db.locales.global[localeID].templates[mmFACID] = localeEntry;

                //Normal
                else
                {
                    this.db.locales.global[localeID][name] =            localeEntry.Name;
                    this.db.locales.global[localeID][shortname] =       localeEntry.ShortName;
                    this.db.locales.global[localeID][description] =     localeEntry.Description;
                }
            }

            else 
            {
                if ( isItem ) this.logger.warning("WARNING: Missing locale entry for item: " + mmFACID);
                else this.logger.debug("No locale entries for item/clothing: " + mmFACID)
            }

            //Also add the necessary preset locale entries if they exist
            if ( isItem && mmFACItem.presets )
            {
                for (const preset in mmFACItem.presets)
                {
                    if (modConfig.oldLocales) this.db.locales.global[localeID].preset[preset] = {
                        "Name": mmFACItem.presets[preset]
                    };
                    else
                    {
                        this.db.locales.global[localeID][preset] = mmFACItem.presets[preset];
                    }
                }
            }
        }
    }

    /*
    private checkJSON(jsonToCheck: object): void
    {
        
    }
    */
}

module.exports = { mod: new AddItems() }