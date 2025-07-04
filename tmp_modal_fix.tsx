                        />

                      {/* Categoría */}
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedCategoryId(value)
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredCategories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                        />

                      {/* Subcategoría */}
                      <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoría</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar subcategoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredSubcategories.map((subcategory: any) => (
                                  <SelectItem key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                        />

                      {/* Billetera */}
                      <FormField
                        control={form.control}
                        name="wallet_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billetera</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar billetera" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {wallets?.map((wallet: any) => (
                                  <SelectItem key={wallet.id} value={wallet.id}>
                                    {wallet.wallets.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                        />

                      {/* Moneda */}
                      <FormField
                        control={form.control}
                        name="currency_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar moneda" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencies?.map((currency: any) => (
                                  <SelectItem key={currency.id} value={currency.id}>
                                    {currency.currencies.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                        />

                      {/* Cantidad */}
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                        />

                      {/* Descripción */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descripción del movimiento"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                        />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onSave={form.handleSubmit(onSubmit)}
            isLoading={saveMutation.isPending}
            onCancel={onClose}
          />
        )
      }}
    </CustomModalLayout>
  )
}