-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceInput" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factoryId" TEXT NOT NULL,

    CONSTRAINT "ResourceInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceOutput" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factoryId" TEXT NOT NULL,

    CONSTRAINT "ResourceOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InputResource" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "resourceInputId" TEXT NOT NULL,
    "resourceNodeId" TEXT,
    "factoryOriginId" TEXT,

    CONSTRAINT "InputResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutputResource" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "resourceOutputId" TEXT NOT NULL,
    "factoryDestinationId" TEXT,

    CONSTRAINT "OutputResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "clockSpeed" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "factoryId" TEXT NOT NULL,
    "recipeId" TEXT,
    "gameClassName" TEXT,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "craftTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameClassName" TEXT,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "itemId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "isInput" BOOLEAN NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameClassName" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "purity" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFlow" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "sourceBuildingId" TEXT,
    "targetBuildingId" TEXT,
    "sourceFactoryId" TEXT,
    "targetFactoryId" TEXT,

    CONSTRAINT "ItemFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameItem" (
    "className" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stackSize" INTEGER,
    "energy" DOUBLE PRECISION,
    "radioactive" DOUBLE PRECISION,
    "canBeDiscarded" BOOLEAN,
    "sinkPoints" INTEGER,
    "abbreviation" TEXT,
    "form" TEXT,
    "fluidColor" TEXT,
    "alienItem" BOOLEAN,
    "stable" BOOLEAN,
    "experimental" BOOLEAN,

    CONSTRAINT "GameItem_pkey" PRIMARY KEY ("className")
);

-- CreateTable
CREATE TABLE "GameRecipe" (
    "className" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unlockedBy" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,
    "alternate" BOOLEAN,
    "inCraftBench" BOOLEAN,
    "inWorkshop" BOOLEAN,
    "inBuildGun" BOOLEAN,
    "inCustomizer" BOOLEAN,
    "manualCraftingMultiplier" DOUBLE PRECISION,
    "minPower" DOUBLE PRECISION,
    "maxPower" DOUBLE PRECISION,
    "stable" BOOLEAN,
    "experimental" BOOLEAN,

    CONSTRAINT "GameRecipe_pkey" PRIMARY KEY ("className")
);

-- CreateTable
CREATE TABLE "GameRecipeItem" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isInput" BOOLEAN NOT NULL,
    "recipeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "GameRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBuilding" (
    "className" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unlockedBy" TEXT,
    "powerUsage" DOUBLE PRECISION,
    "powerGenerated" DOUBLE PRECISION,
    "supplementPerMinute" DOUBLE PRECISION,
    "overclockable" BOOLEAN,
    "somersloopSlots" INTEGER,
    "isVehicle" BOOLEAN,
    "stable" BOOLEAN,
    "experimental" BOOLEAN,

    CONSTRAINT "GameBuilding_pkey" PRIMARY KEY ("className")
);

-- CreateTable
CREATE TABLE "GameRecipeBuilding" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,

    CONSTRAINT "GameRecipeBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_isInput_idx" ON "RecipeItem"("recipeId", "isInput");

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_key" ON "Item"("name");

-- CreateIndex
CREATE INDEX "GameRecipeItem_recipeId_isInput_idx" ON "GameRecipeItem"("recipeId", "isInput");

-- CreateIndex
CREATE UNIQUE INDEX "GameRecipeBuilding_recipeId_buildingId_key" ON "GameRecipeBuilding"("recipeId", "buildingId");

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceInput" ADD CONSTRAINT "ResourceInput_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceOutput" ADD CONSTRAINT "ResourceOutput_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputResource" ADD CONSTRAINT "InputResource_factoryOriginId_fkey" FOREIGN KEY ("factoryOriginId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputResource" ADD CONSTRAINT "InputResource_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputResource" ADD CONSTRAINT "InputResource_resourceInputId_fkey" FOREIGN KEY ("resourceInputId") REFERENCES "ResourceInput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputResource" ADD CONSTRAINT "InputResource_resourceNodeId_fkey" FOREIGN KEY ("resourceNodeId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutputResource" ADD CONSTRAINT "OutputResource_factoryDestinationId_fkey" FOREIGN KEY ("factoryDestinationId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutputResource" ADD CONSTRAINT "OutputResource_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutputResource" ADD CONSTRAINT "OutputResource_resourceOutputId_fkey" FOREIGN KEY ("resourceOutputId") REFERENCES "ResourceOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_gameClassName_fkey" FOREIGN KEY ("gameClassName") REFERENCES "GameBuilding"("className") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_gameClassName_fkey" FOREIGN KEY ("gameClassName") REFERENCES "GameRecipe"("className") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_gameClassName_fkey" FOREIGN KEY ("gameClassName") REFERENCES "GameItem"("className") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFlow" ADD CONSTRAINT "ItemFlow_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFlow" ADD CONSTRAINT "ItemFlow_sourceBuildingId_fkey" FOREIGN KEY ("sourceBuildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFlow" ADD CONSTRAINT "ItemFlow_sourceFactoryId_fkey" FOREIGN KEY ("sourceFactoryId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFlow" ADD CONSTRAINT "ItemFlow_targetBuildingId_fkey" FOREIGN KEY ("targetBuildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFlow" ADD CONSTRAINT "ItemFlow_targetFactoryId_fkey" FOREIGN KEY ("targetFactoryId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecipeItem" ADD CONSTRAINT "GameRecipeItem_inputItem_fkey" FOREIGN KEY ("itemId") REFERENCES "GameItem"("className") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecipeItem" ADD CONSTRAINT "GameRecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "GameRecipe"("className") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecipeBuilding" ADD CONSTRAINT "GameRecipeBuilding_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "GameBuilding"("className") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecipeBuilding" ADD CONSTRAINT "GameRecipeBuilding_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "GameRecipe"("className") ON DELETE CASCADE ON UPDATE CASCADE;
